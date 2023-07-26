import { env } from '@/constants/env';
import { ApnsNotificationPay } from './apns';

export const sendSipCallNotification = async (to_number: string, body: ApnsNotificationPay) => {
    const rawResponse = await fetch(env.SIP_PUSH_API + '/call/' + to_number + '/make_call?token=' + env.SIP_PUSH_TOKEN, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const content = await rawResponse.text();
    console.log(content);
}