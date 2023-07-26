import { env } from "@/constants/env";
import { ApiExceptionHandler, ApiResponse, error, success } from "@/lib/api_helper";
import { getPrisma } from "@/lib/database";
import { createComposeToken, getBlueseaConfig, submitComposeRecord } from "@/lib/live_api_helper";
import { Body, Catch, createHandler, Post, Query } from "next-api-decorators";

enum BlueseaHookEvent {
    RoomStarted = 'room_started',
    RoomStopped = 'room_stopped',
    RoomRecordStarted = 'room_record_started',
    PeerJoined = 'peer_joined',
    StreamStarted = 'stream_started',
    PeerLeaved = 'peer_leaved',
    RoomLastPeerLeaved = 'room_last_peer_leaved',
    StreamStoped = 'stream_stopped',
    RoomRecordComposeFinished = 'room_record_compose_finished',
}

class RoomStartedEvent {
    type!: 'room_started';
}

class RoomStoppedEvent {
    type!: 'room_stopped';
    join_count!: number;
}

class RoomRecordStarted {
    type!: 'room_record_started';
    record_uri!: string;
    record_path!: string;
}

class RoomRecordComposeFinished {
    type!: 'room_record_compose_finished';
    play_uri!: string;
}

class PeerJoinedEvent {
    type!: 'peer_joined';
    peer_id!: string;
    session_uuid!: string;
    user_agent!: string;
    ip!: string;
    connect_ms!: number;
    zone!: number[];
}

class StreamStartedEvent {
    type!: 'stream_started';
    peer_id!: string;
    session_uuid!: string;
    stream_kind!: 'audio' | 'video';
    stream_name!: string;
}

class PeerLeavedEvent {
    type!: 'peer_leaved';
    peer_id!: string;
    session_uuid!: string;
}

class RoomLastPeerLeaved {
    type!: 'room_last_peer_leaved';
    joined_count!: number;
}

class StreamStopedEvent {
    type!: 'stream_stopped';
    peer_id!: string;
    session_uuid!: string;
    stream_kind!: 'audio' | 'video';
    stream_name!: string;
    stats!: {
        mos?: [number, number, number];
        rtt?: [number, number, number];
        jitter?: [number, number, number];
        lost?: [number, number, number];
    }
}

class HookBody {
    app_id!: string;
    room_id!: string;
    timestamp!: number;
    event!: RoomRecordStarted | RoomStartedEvent | RoomStoppedEvent | PeerJoinedEvent | StreamStartedEvent | PeerLeavedEvent | RoomLastPeerLeaved | StreamStopedEvent | RoomRecordComposeFinished;
}

@Catch(ApiExceptionHandler)
class BlueseaHookRouter {
    @Post('/hook')
    async hook(@Query('token') token: string, @Query('group') group: string | undefined, @Body() body: HookBody): Promise<ApiResponse<string>> {
        if (token != env.HOOK_TOKEN) {
            return error('WRONG_TOKEN')
        }

        const prisma = getPrisma()
        switch (body.event.type) {
            case BlueseaHookEvent.RoomRecordStarted: {
                const record_event = body.event as RoomRecordStarted;
                await prisma.room.update({
                    where: {
                        id: body.room_id,
                    },
                    data: {
                        record_uri: record_event.record_uri,
                        record_path: record_event.record_path,
                    }
                })
                break;
            }
            case BlueseaHookEvent.RoomRecordComposeFinished: {
                const record_event = body.event as RoomRecordComposeFinished;
                await prisma.room.update({
                    where: {
                        id: body.room_id,
                    },
                    data: {
                        compose_url: record_event.play_uri,
                    }
                })
                break;
            }
            case BlueseaHookEvent.PeerJoined: {
                const peer_event = body.event as PeerJoinedEvent;
                await prisma.streamSession.updateMany({
                    where: {
                        room_id: body.room_id,
                        number: peer_event.peer_id,
                    },
                    data: {
                        user_agent: peer_event.user_agent,
                        ip: peer_event.ip,
                        connect_ms: peer_event.connect_ms,
                        zone_lat: peer_event.zone ? peer_event.zone[0] : null,
                        zone_lon: peer_event.zone ? peer_event.zone[1] : null,
                    }
                })
                break;
            }
            case BlueseaHookEvent.StreamStarted: {
                const stream_event = body.event as StreamStartedEvent;
                if (stream_event.stream_kind == 'audio' && stream_event.stream_name == 'audio_main') {
                    await prisma.streamSession.updateMany({
                        where: {
                            room_id: body.room_id,
                            number: stream_event.peer_id,
                            joined_at: null,
                        },
                        data: {
                            joined_at: new Date(body.timestamp),
                        }
                    })
                }
                break;
            }
            case BlueseaHookEvent.StreamStoped: {
                const stream_event = body.event as StreamStopedEvent;
                if (stream_event.stream_kind == 'audio' && stream_event.stream_name == 'audio_main') {
                    await prisma.streamSession.updateMany({
                        where: {
                            room_id: body.room_id,
                            number: stream_event.peer_id,
                        },
                        data: {
                            leaved_at: new Date(body.timestamp),
                            mos_min: stream_event.stats.mos?.[0],
                            mos: stream_event.stats.mos?.[1],
                            mos_max: stream_event.stats.mos?.[2],
                            rtt_min: stream_event.stats.rtt?.[0],
                            rtt: stream_event.stats.rtt?.[1],
                            rtt_max: stream_event.stats.rtt?.[2],
                            jitter_min: stream_event.stats.jitter?.[0],
                            jitter: stream_event.stats.jitter?.[1],
                            jitter_max: stream_event.stats.jitter?.[2],
                            lost_min: stream_event.stats.lost?.[0],
                            lost: stream_event.stats.lost?.[1],
                            lost_max: stream_event.stats.lost?.[2],
                        }
                    })
                }
                break;
            }
            case BlueseaHookEvent.RoomStopped: {
                const room = await prisma.room.findUnique({
                    where: {
                        id: body.room_id,
                    },
                })
                if (room && room.record_uri) {
                    const bluesea_config = await getBlueseaConfig(group);
                    const token = await createComposeToken(room.id, bluesea_config);
                    const job_id = await submitComposeRecord(room.record_uri, token, bluesea_config);
                    await prisma.room.update({
                        where: {
                            id: body.room_id,
                        },
                        data: {
                            compose_job_id: job_id,
                        }
                    })
                }
                break;
            }
            default:
                break;
        }
        return success('ok')
    }
}

export default createHandler(BlueseaHookRouter)