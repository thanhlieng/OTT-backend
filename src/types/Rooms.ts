import { Call, CallActionLogs, Room, StreamSession } from "@prisma/client";

export type RoomInfo = {
    id: string,
    from: StreamSession,
    to: StreamSession,
    state: string,
    created_at: Date,
    started_at?: Date,
    ended_at?: Date,
    connect_time: number,
    duration: number,
    group: boolean,
}

export type StreamSessionDetails = StreamSession & {
    hook_logs: CallActionLogs[];
}

export type SingleCallDetails = Call & {
    sessions: StreamSessionDetails[];
}

export type RoomDetails = Room & {
    calls: SingleCallDetails[];
}