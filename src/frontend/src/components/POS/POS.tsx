// src/components/POS.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Group,
    Title,
    Button,
    Text,
    Grid,
    Box,
    Badge
} from '@mantine/core';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { get, post } from 'aws-amplify/api';

// Numeric keypad layout
const keypad = ['1','2','3','4','5','6','7','8','9','','0','C'];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function POS() {
    const [step, setStep] = useState<Step>(1);
    const [items, setItems] = useState<number[]>([]);
    const [newPrice, setNewPrice] = useState('0.00');
    const [timeLeft, setTimeLeft] = useState(60);

    const [locationID, setLocationID] = useState<string>('');
    const [locationName, setLocationName] = useState<string>('');
    const [squareLocationID, setSquareLocationID] = useState<string>('');

    // Prevent double-submission
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Store active checkout for possible cancellation
    const [checkoutId, setCheckoutId] = useState<string>('');
    // Polling interval ref
    const pollRef = useRef<NodeJS.Timeout>();

    const [terminalDeviceId, setTerminalDeviceId] = useState<string>('');
    const [terminalDeviceCodeId, setTerminalDeviceCodeId] = useState<string>('');

    const inactivityRef = useRef<NodeJS.Timeout>();

    // Reset app
    const resetAll = () => {
        setStep(1);
        setItems([]);
        setNewPrice('0.00');
        setTimeLeft(60);
        clearInterval(inactivityRef.current);
    };

    // Inactivity timer
    const startInactivity = () => {
        clearInterval(inactivityRef.current);
        setTimeLeft(60);
        inactivityRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(inactivityRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };


    // Fetch location
    useEffect(() => {
        (async () => {
            try {
                const attrs = await fetchUserAttributes();
                const loc = attrs['custom:location'];
                if (loc) setLocationID(loc);
            } catch {}
        })();
    }, []);

    // Fetch location name once we have the location ID
    useEffect(() => {
        if (!locationID) return;
        (async () => {
            try {
                const res = await get({
                    apiName: 'POSAPI',
                    path: `/locations/${locationID}`,
                }).response;
                const data = await new Response((res as any).body).json();
                setLocationName(data.Name || data.name || '');
                setSquareLocationID(data.SquareLocation || data.squareLocation || '');
            } catch (err) {
                console.error('Error fetching location name', err);
            }
        })();
    }, [locationID]);

    useEffect(() => {
        if (!squareLocationID) return;
        (async () => {
            try {
                // fetch devices and select the one for the current Square location
                const devRes = await get({ apiName: 'POSAPI', path: '/square/devices' }).response;
                const devJson = await new Response((devRes as any).body).json();
                // Debug log devJson and squareLocationID
                console.debug('Square Devices:', devJson, 'squareLocationID:', squareLocationID);
                // Trim and uppercase squareLocationID for comparison
                const matchLocID = squareLocationID.trim().toUpperCase();
                const terminal = (devJson || []).find((d: any) =>
                    d.attributes?.type === 'TERMINAL' &&
                    d.components?.some((c: any) =>
                        (c.applicationDetails?.sessionLocation?.trim?.().toUpperCase?.() ?? '') === matchLocID
                    )
                );
                if (!terminal) {
                    console.warn('No matching terminal found for Square Location ID:', squareLocationID, 'in devices:', devJson);
                    setTerminalDeviceId('');
                    setTerminalDeviceCodeId('');
                    return;
                }
                const deviceId = terminal.id?.replace('device:', '') || '';
                setTerminalDeviceId(deviceId);

                // extract the deviceCodeId for this location
                const codeComp = terminal.components?.find((c: any) =>
                    (c.applicationDetails?.sessionLocation?.trim?.().toUpperCase?.() ?? '') === matchLocID &&
                    c.applicationDetails?.deviceCodeId
                );
                const codeId = codeComp?.applicationDetails?.deviceCodeId || '';
                setTerminalDeviceCodeId(codeId);
            } catch (err) {
                console.error('Error initializing terminal', err);
            }
        })();
    }, [squareLocationID]);

    // Reset inactivity on step change, but only start timeout if there's at least one item
    useEffect(() => {
        // clear any existing timer
        clearInterval(inactivityRef.current);
        if (items.length > 0) {
            startInactivity();
        }
        return () => clearInterval(inactivityRef.current);
    }, [step, items.length]);


    useEffect(() => {
        if (step === 4) {
            completePayment('Card');
        }
    }, [step]);

    // Poll Square checkout status every 5 seconds when on step 4
    useEffect(() => {
        if (step === 4 && checkoutId) {
            clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
                try {
                    const res = await get({
                        apiName: 'POSAPI',
                        path: `/square/checkouts/${checkoutId}`,
                    }).response;
                    const json = await new Response((res as any).body).json();
                    const status = json.checkout?.status ?? json.status;
                    if (status === 'COMPLETED') {
                        clearInterval(pollRef.current);
                        setStep(5);
                    } else if (status === 'CANCELED' || status === 'ERROR') {
                        clearInterval(pollRef.current);
                        resetAll();
                    }
                } catch (err) {
                    console.error('Error polling checkout status', err);
                }
            }, 5000);
        }
        return () => clearInterval(pollRef.current);
    }, [step, checkoutId]);

    // Handle keypad input
    const onDigit = (d: string) => {
        startInactivity();
        let str = newPrice.replace('.', '');
        if (d === 'C') {
            setNewPrice('0.00'); return;
        }
        if (str.length >= 5) return;
        str = str === '000' ? '' : str;
        str += d;
        while (str.length < 3) str = '0' + str;
        const dollars = str.slice(0, -2);
        const cents = str.slice(-2);
        setNewPrice(`${parseInt(dollars)}.${cents}`);
    };

    // Add item
    const onAdd = () => {
        const val = parseFloat(newPrice);
        setItems((arr) => [...arr, val]);
        setNewPrice('0.00');
        // on first-price-entry, reset inactivity to 45s
        clearInterval(inactivityRef.current);
        setTimeLeft(45);
        inactivityRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) { clearInterval(inactivityRef.current); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    const total = items.reduce((a,b) => a + b, 0);

    // Complete transaction
    const completePayment = async (method: string) => {
        if (isProcessingPayment) return;
        setIsProcessingPayment(true);
        if (method === 'Card') {
            clearInterval(inactivityRef.current!);
            try {
                // Build and log Square checkout payload
                const amountMoney = { amount: Math.round(total * 100), currency: 'USD' };
                const checkoutPayload = {
                    idempotencyKey: `${Date.now()}`,
                    amountMoney,
                    deviceOptions: { deviceId: terminalDeviceId },
                };
                console.log('checkout payload ▶', checkoutPayload);
                const checkoutResOp = post({
                    apiName: 'POSAPI',
                    path: '/square/checkouts',
                    options: {
                        body: JSON.stringify(checkoutPayload),
                        headers: { 'Content-Type': 'application/json' },
                    },
                });
                const checkoutRes = await checkoutResOp.response;
                const checkoutJson = await new Response((checkoutRes as any).body).json();
                console.log('checkout created ▶', checkoutJson);
                // stay on step 4 and save checkoutId for cancellation
                const generatedId = checkoutJson.checkout?.id ?? '';
                console.log('resolved checkoutId ▶', generatedId);
                if (generatedId) {
                    setCheckoutId(generatedId);
                } else {
                    console.warn('No checkout.id found in response', checkoutJson);
                }
                setStep(4);
                startInactivity();
            } catch (err) {
                console.error('Error creating checkout:', err);
            } finally {
                setIsProcessingPayment(false);
            }
            return;
        }
        try {
            const txOp = post({
                apiName: 'POSAPI',
                path: '/transactions',
                options: {
                    body: JSON.stringify({ Total: total, TransactionDate: new Date().toISOString(), LocationID: locationID }),
                    headers: { 'Content-Type': 'application/json' },
                },
            });
            const txRes = await txOp.response;
            const txJson = await new Response((txRes as any).body).json();
            console.log('completePayment ▶ transaction response:', txJson);
            const txID = txJson.TransactionID ?? txJson.id ?? txJson.transactionID;
            if (!txID) {
                throw new Error(`Missing TransactionID in response: ${JSON.stringify(txJson)}`);
            }
            const payOp = post({
                apiName: 'POSAPI',
                path: '/payments',
                options: {
                    body: JSON.stringify({ TransactionID: txID, Amount: total, PaymentMethod: method }),
                    headers: { 'Content-Type': 'application/json' },
                },
            });
            await payOp.response;
            setStep(5);
        } catch (error) {
            console.error('Error completing payment:', error);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // After thank you, auto-reset after 20 seconds
    useEffect(() => {
        if (step === 5) {
            const timer = setTimeout(() => {
                resetAll();
            }, 20000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Handle timeout and cancellation
    useEffect(() => {
        if (timeLeft === 0) {
            if (step === 4 && checkoutId) {
                (async () => {
                    console.log('Cancelling checkout due to timeout', checkoutId);
                    try {
                        await post({
                            apiName: 'POSAPI',
                            path: '/square/checkouts/cancel',
                            options: {
                                body: JSON.stringify({ cancelId: checkoutId }),
                                headers: { 'Content-Type': 'application/json' },
                            },
                        }).response;
                        console.log('Checkout cancelled');
                    } catch (err) {
                        console.error('Error cancelling checkout', err);
                    } finally {
                        resetAll();
                    }
                })();
            } else {
                resetAll();
            }
        }
    }, [timeLeft]);

    return (
        <Container size="xs" style={{ textAlign: 'center', position: 'relative' }}>
            <Group mb="sm" style={{ justifyContent: 'center' }}>
                <Title
                    order={2}
                    style={{ fontWeight: 700, marginBottom: '0.5rem' }}
                >
                    Self Serve Check Out
                </Title>
            </Group>
            {locationName && (
                <Group mb="sm" style={{ justifyContent: 'center' }}>
                    <Title order={4}>{locationName}</Title>
                </Group>
            )}
            {timeLeft <= 30 && (
                <Badge color="red" variant="outline">Timeout in {timeLeft}s</Badge>
            )}

            {step === 1 && (
                <>
                    <Title order={3}>Enter Item Price</Title>
                    <Text size="xl">${newPrice}</Text>
                    <Grid mt="md">
                        {keypad.map((d,i) => (
                            <Grid.Col span={4} key={i}>
                                {d === '' ? <Box /> : (
                                    <Button fullWidth size="xl" color={d==='C'?'red':undefined} onClick={() => onDigit(d)}>{d}</Button>
                                )}
                            </Grid.Col>
                        ))}
                    </Grid>
                    <Group mt="md">
                        <Button onClick={onAdd}>Add Item</Button>
                        <Button onClick={() => { onAdd(); setStep(2); }}>Checkout</Button>
                    </Group>
                    <Text size="xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {`Total: $${(items.reduce((a,b) => a + b, 0) + parseFloat(newPrice)).toFixed(2)}`}
                    </Text>
                    <Box mt="md">
                        {items.map((v, i) => (
                            <Group
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.25rem',
                                    lineHeight: 1.2,
                                }}
                            >
                                <Text>{`Item ${i + 1}: $${v.toFixed(2)}`}</Text>
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    style={{ fontSize: '3rem', padding: '0 8px' }}
                                    onClick={() => {
                                        setItems((arr) => arr.filter((_, idx) => idx !== i));
                                    }}
                                >✕</Button>
                            </Group>
                        ))}
                    </Box>
                </>
            )}

            {step === 2 && (
                <>
                    <Title order={3}>Select Payment Method</Title>
                    <Group mt="md" style={{ justifyContent: 'center' }}>
                        <Button
                            size="xl"
                            style={{
                                fontSize: '2rem',
                                minWidth: 150,
                                whiteSpace: 'normal',
                                lineHeight: 1.2,
                                padding: '1rem',
                                overflow: 'visible',
                                height: 'auto',
                                minHeight: '100px',
                                wordBreak: 'break-word',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onClick={() => setStep(3)}
                        >
                            Cash
                        </Button>
                        <Button
                            size="xl"
                            style={{
                                fontSize: '2rem',
                                minWidth: 150,
                                whiteSpace: 'normal',
                                lineHeight: 1.2,
                                padding: '1rem',
                                overflow: 'visible',
                                height: 'auto',
                                minHeight: '100px',
                                wordBreak: 'break-word',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onClick={() => setStep(4)}
                        >
                            <>Credit, Debit<br/>Apple Pay</>
                        </Button>
                    </Group>
                </>
            )}

            {step === 3 && (
                <>
                    <Title order={4}>Please deposit:</Title>
                    <Text size="xl" color="green">${total.toFixed(2)}</Text>
                    <Text>into the cash box</Text>
                    <Group mt="md">
                        <Button
                            onClick={() => completePayment('Cash')}
                            disabled={isProcessingPayment}
                            loading={isProcessingPayment}
                        >
                            Continue
                        </Button>
                    </Group>
                </>
            )}

            {step === 4 && (
                <>
                    <Title order={4}>Please complete transaction on terminal</Title>
                    <Text mt="md">Waiting for terminal...</Text>
                </>
            )}

            {step === 5 && (
                <>
                    <Title order={3}>Thank you for your purchase!</Title>
                </>
            )}
        </Container>
    );
}