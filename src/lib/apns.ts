import http2 from 'http2';
import { env } from '@/constants/env';

export const sendNotification = (deviceId: string, aps: any, production: boolean) => {
    return new Promise((resolve, reject) => {
        const client = http2.connect(
            production ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com',
            {
                pfx: env.APPLE_PUSH_P12,
                passphrase: '',
            }
        );

        const req = client.request({
            ':method': 'POST',
            ':path': `/3/device/${deviceId}`,
            'apns-topic': env.APPLE_PUSH_TOPIC,
        });

        req.on('response', (headers) => {
            console.log(headers);
        });

        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('end', () => {
            client.close();
            resolve(true);
        });

        req.write(JSON.stringify({
            aps
        }));
        req.end();
    })
}

export interface ApnsNotificationPay {
    call_id: string,
    call_type: string,
    caller_id_name: string,
    caller_id_number: string,
    gateways: string | string[],
    room_id: string,
    peer_id: string,
    token: string,
    hook: string,
}

export const sendIncomingCallNotification = async (deviceId: string, body: ApnsNotificationPay, production: boolean | null) => {
    const conf = {
        "alert": {
            "type": "incomming",
            "call_id": body.call_id,
            "call_type": body.call_type,
            "caller_id_name": body.caller_id_name,
            "caller_id_number": body.caller_id_number,
            "hook": body.hook,
            "bluesea": {
                "gateways": body.gateways,
                "room_id": body.room_id,
                "peer_id": body.peer_id,
                "token": body.token,
            }
        },
    };
    if (production == null) {
        sendNotification(deviceId, conf, true)
        sendNotification(deviceId, conf, false)
    } else {
        sendNotification(deviceId, conf, production)
    }
}

export const sendCancelCallNotification = async (deviceId: string, call_id: string, call_type: string, caller_name: string | undefined, caller_number: string, production: boolean) => {
    const conf = {
        "alert": {
            "type": "cancel",
            "call_id": call_id,
            "call_type": call_type,
            "caller_id_name": caller_name,
            "caller_id_number": caller_number,
        },
    }

    if (production == null) {
        sendNotification(deviceId, conf, true)
        sendNotification(deviceId, conf, false)
    } else {
        return sendNotification(deviceId, conf, production)
    }
}