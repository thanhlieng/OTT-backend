import { Call, CallState } from "@prisma/client"

export function generate_call_state(call: Call) {
    switch(call.state) {
        case CallState.WAITING:
            return 'waiting'
        case CallState.RINGING:
            return 'ringing'
        case CallState.ACCEPTED:
            return 'answered'
        case CallState.REJECTED:
            return 'rejected'
        case CallState.CANCELED:
            return 'canceled'
        case CallState.ENDED:
            return 'answered'
        case CallState.ERROR:
            return 'error'
        case CallState.TIMEOUT:
            return 'timeout'
        default:
            return 'unknown'
    }
}

export function generate_call_times(sessions: {number: string, created_at: Date, joined_at: Date, leaved_at: Date}[]) {
    const created_at = sessions.filter((s) => s.created_at !== null).map((s) => s.created_at.getTime())
    const joined_ts = sessions.filter((s) => s.joined_at !== null).map((s) => s.joined_at.getTime())
    const leaved_ts = sessions.filter((s) => s.leaved_at !== null).map((s) => s.leaved_at.getTime())
    let duration = 0;
    let connect_time = 0;
    let started_at = null;
    let ended_at = null;
    created_at.sort()
    joined_ts.sort()
    leaved_ts.sort()

    if (joined_ts.length >=2 && leaved_ts.length >= 2) {
        duration = leaved_ts[leaved_ts.length - 2] - joined_ts[1]
        connect_time = joined_ts[1] - joined_ts[0]
        started_at = new Date(joined_ts[1])
        ended_at = new Date(leaved_ts[leaved_ts.length - 2])
    } else {
        started_at = new Date(created_at[0])
    }
    return { duration, connect_time, started_at, ended_at }
}