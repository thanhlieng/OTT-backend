import {
    Catch, createHandler, DefaultValuePipe, Get, Param, ParseNumberPipe, Query, SetHeader
} from 'next-api-decorators';

import { RoomDetails, RoomInfo, AllowUserManagerRole, UserRole } from '@/types';
import { ApiExceptionHandler, ApiResponse, NextAuthGuard, SessionUser, success } from '@/lib/api_helper';
import { getPrisma } from '@/lib/database';
import { PageRes } from '@/utils/request';
import { Parser } from '@json2csv/plainjs'
import { CallActionLogs, StreamSession } from '@prisma/client';
import { generate_call_state, generate_call_times } from '@/lib/call_log';

@NextAuthGuard()
@Catch(ApiExceptionHandler)
class RoomRouter {
    @Get('')
    @SetHeader('Cache-Control', 'nostore')
    public async get_list(
        @SessionUser() user: SessionUser,
        @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
        @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
        @Query('search') search?: string,
    ): Promise<ApiResponse<PageRes<RoomInfo>>> {
        if (!AllowUserManagerRole(user.role)) {
            return { status: false, error: 'NO_PERMISSION' }
        }
        const groups = user.groups.map((g) => g.group_id)
        let calls_conditions: any = {
            some: {}
        }
        if (user.role == UserRole.ADMIN) {
            calls_conditions = {
                some: {
                    OR: [
                        { from: { manage_by_id: { in: groups } } },
                        { to: { manage_by_id: { in: groups } } },
                        { from_number: { contains: search } },
                        { to_number: { contains: search } },
                    ]
                }
            }
        }
        const rooms = await getPrisma().room.findMany({
            where: {
                calls: calls_conditions
            },
            include: {
                calls: {
                    include: {
                        sessions: true,
                    },
                    orderBy: {
                        created_at: 'asc',
                    }
                },
                sessions: {
                    select: {
                        number: true,
                        joined_at: true,
                        leaved_at: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: 'asc',
                    }
                },
            },
            skip,
            take: limit,
            orderBy: {
                created_at: 'desc',
            }
        })
        const count = await getPrisma().room.count({
            where: {
                calls: calls_conditions
            }
        })
        
        // @ts-ignore
        return success({
            skip,
            total: count,
            data: rooms.filter((r: { calls: string | any[] }) => r.calls.length > 0).map((r: any) => {
                const { connect_time, duration, ended_at, started_at } = generate_call_times(r.sessions);

                //get from and to inside calls[0].sessions by compare number
                let from: any = {
                    number: r.calls[0].from_number,
                };
                let to: any = {
                    number: r.calls[0].to_number,
                };
                r.calls[0].sessions.map((s: any) => {
                    if(s.number == r.calls[0].from_number) {
                        from = s;
                    } else if(s.number == r.calls[0].to_number) {
                        to = s;
                    }
                });

                return {
                    id: r.id,
                    from,
                    to,
                    state: generate_call_state(r.calls[0]),
                    connect_time,
                    duration,
                    created_at: r.created_at,
                    started_at,
                    ended_at,
                    group: r.calls.length > 1,
                }
            })
        })
    }

    @Get('/:id')
    @SetHeader('Cache-Control', 'nostore')
    public async get_one(@SessionUser() user: SessionUser, @Param('id') id: string): Promise<ApiResponse<RoomDetails>> {
        if (!AllowUserManagerRole(user.role)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const groups = user.groups.map((g) => g.group_id)
        let calls_conditions: any = {
            some: {}
        }
        if (user.role == UserRole.ADMIN) {
            calls_conditions = {
                some: {
                    OR: [
                        { from: { manage_by_id: { in: groups } } },
                        { to: { manage_by_id: { in: groups } } },
                    ]
                }
            }
        }

        const room = await getPrisma().room.findFirst({
            where: { 
                id,
                calls: calls_conditions
            },
            include: {
                calls: {
                    orderBy: {
                        created_at: 'asc',
                    },
                    include: {
                        sessions: {
                            include: {
                                hook_logs: true,
                            }
                        }
                    }
                },
            }
        })

        if (room) {
            return success(room)
        } else {
            return { status: false, error: 'NOT_FOUND' }
        }
    }

    @Get('/exports/csv')
    @SetHeader('Cache-Control', 'nostore')
    public async export(
        @SessionUser() user: SessionUser,
        @Query('begin', ParseNumberPipe) begin?: number,
        @Query('end', ParseNumberPipe) end?: number,
        @Query('timezone') timeZone = 'Asia/Saigon',
    ): Promise<string> {
        if (!AllowUserManagerRole(user.role)) {
            throw Error('NO_PERMISSION')
        }

        const groups = user.groups.map((g) => g.group_id)
        let calls_conditions: any = {
            some: {}
        }
        if (user.role == UserRole.ADMIN) {
            calls_conditions = {
                some: {
                    OR: [
                        { from: { manage_by_id: { in: groups } } },
                        { to: { manage_by_id: { in: groups } } },
                    ]
                }
            }
        }

        // If begin and end is not set, export today
        if (!begin || !end) {
            const today = new Date();
            begin = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
        }

        // If begin and end bigger than 1 month, throw error
        if (end - begin > 30 * 24 * 60 * 60 * 1000) {
            throw Error('EXPORT_TOO_LONG')
        }

        console.log(begin, end)
        console.log(new Date(begin), new Date(end))

        const rooms = await getPrisma().room.findMany({
            where: { 
                calls: calls_conditions,
                created_at: { gte: new Date(begin), lte: new Date(end) } 
            },
            include: {
                calls: {
                    orderBy: {
                        created_at: 'asc',
                    },
                    include: {
                        sessions: {
                            include: {
                                hook_logs: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                created_at: 'desc',
            }
        })

        console.log('--------------------------------------------------------')
        console.log('rooms', rooms)
        console.log('--------------------------------------------------------')
        
        const data = rooms.filter((r: any) => r.calls.length > 0).map((r: any) => {
            const caller_number = r.calls[0].from_number
            const callee_number = r.calls[0].to_number
            const { connect_time, duration, started_at } = generate_call_times(r.calls[0].sessions);
            let caller_log: CallActionLogs | null | any = null;
            let caller_stream: StreamSession | null | any = null;
            let callee_log: CallActionLogs | null | any = null;
            let callee_stream: StreamSession | null | any = null;

            r.calls[0].sessions.map((s: any) => {
                if (s.number == caller_number) {
                    caller_log = s.hook_logs[0]
                    caller_stream = s
                } else if (s.number == callee_number) {
                    callee_log = s.hook_logs[0]
                    callee_stream = s
                }
            })

            return {
                id: r.id,
                started_at: started_at.toLocaleString('en-GB', { timeZone, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", year: "2-digit", month: "2-digit", day: "2-digit", timeZoneName: "short" }),
                ended_at: started_at.toLocaleString('en-GB', { timeZone, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", year: "2-digit", month: "2-digit", day: "2-digit", timeZoneName: "short" }),
                caller: caller_number,
                caller_device: caller_log?.device,
                caller_network: caller_log?.network,
                caller_os: caller_log?.os_name,
                caller_os_version: caller_log?.os_version,
                caller_mos_min: caller_stream?.mos_min,
                caller_mos_avg: caller_stream?.mos,
                caller_mos_max: caller_stream?.mos_max,
                caller_jitter_min: caller_stream?.jitter_min,
                caller_jitter_avg: caller_stream?.jitter,
                caller_jitter_max: caller_stream?.jitter_max,
                caller_rtt_min: caller_stream?.rtt_min,
                caller_rtt_avg: caller_stream?.rtt,
                caller_rtt_max: caller_stream?.rtt_max,
                caller_lost_min: caller_stream?.lost_min,
                caller_lost_avg: caller_stream?.lost,
                caller_lost_max: caller_stream?.lost_max,
                callee: callee_number,
                callee_device: callee_log?.device,
                callee_network: callee_log?.network,
                callee_os: callee_log?.os_name,
                callee_os_version: callee_log?.os_version,
                callee_mos_min: callee_stream?.mos_min,
                callee_mos_avg: callee_stream?.mos,
                callee_mos_max: callee_stream?.mos_max,
                callee_jitter_min: callee_stream?.jitter_min,
                callee_jitter_avg: callee_stream?.jitter,
                callee_jitter_max: callee_stream?.jitter_max,
                callee_rtt_min: callee_stream?.rtt_min,
                callee_rtt_avg: callee_stream?.rtt,
                callee_rtt_max: callee_stream?.rtt_max,
                callee_lost_min: callee_stream?.lost_min,
                callee_lost_avg: callee_stream?.lost,
                callee_lost_max: callee_stream?.lost_max,
                call_state: generate_call_state(r.calls[0]),
                duration,
                connect_time,
                record_url: r.compose_url,
            }
        })

        console.log('--------------------------------------------------------')
        console.log('data', data)
        console.log('--------------------------------------------------------')

        const parser = new Parser({})
        const csv = parser.parse(data)
        return csv
    }
}

export default createHandler(RoomRouter)