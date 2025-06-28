// src/components/POS.tsx
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
    Container,
    Group,
    Title,
    Button,
    Text,
    Modal,
    Grid,
    Box,
    Badge,
} from '@mantine/core';
// Shared keypad layout for both Client ID and PIN entry
const keypad = ['1','2','3','4','5','6','7','8','9','','0','C'];
import { get, post, put } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';

type Step = 1 | 2 | 3 | 4 | 5;

export default function POS() {
    const [step, setStep] = useState<Step>(1);

    // shared state
    const [amount, setAmount] = useState('0.00');
    const [clientID, setClientID] = useState('');
    const [pin, setPin] = useState('');
    const [clientBalance, setClientBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // timers
    const [timeLeft, setTimeLeft] = useState(130);
    const timerRef = useRef<NodeJS.Timeout>();

    // Farm association state
    const [hasFarm, setHasFarm] = useState<boolean | null>(null);
    const [farmName, setFarmName] = useState<string>('');
    const [farmID, setFarmID] = useState<number | null>(null);

    // reset all
    const resetAll = () => {
        setStep(1);
        setAmount('0.00');
        setClientID('');
        setPin('');
        setClientBalance(null);
        setError(null);
        setTimeLeft(130);
        clearInterval(timerRef.current);
    };

    // Helper to start/reset the inactivity timer
    const startTimer = () => {
      clearInterval(timerRef.current);
      setTimeLeft(130);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Timeout expired
            if (confirmModalOpen) {
              // Close confirm modal and clear amount
              setConfirmModalOpen(false);
              onClear();
              return 130;
            } else if (step === 1) {
              // On main screen: clear amount
              onClear();
              return 130;
            } else {
              // On other steps: full reset
              resetAll();
              return 0;
            }
          }
          return t - 1;
        });
      }, 1000);
    };

    // reset amount helper
    const onClear = () => {
      startTimer();
      setAmount('0.00');
    };

    // Inactivity timer: reset on step or confirmModalOpen changes
    useEffect(() => {
      startTimer();
      return () => clearInterval(timerRef.current);
    }, [step, confirmModalOpen]);

    // Determine farm from user's custom attribute and fetch its details
    useEffect(() => {
      (async () => {
        try {
          const attrs = await fetchUserAttributes();
          const farmIdStr = attrs['custom:FarmID'];
          if (!farmIdStr) {
            setHasFarm(false);
            return;
          }
          const id = parseInt(farmIdStr, 10);
          setHasFarm(true);
          setFarmID(id);
          // fetch farm name
          const detailRes = await get({
            apiName: 'GarrettGrowersAPI',
            path: `/farmprofiles/${id}`,
          }).response;
          const detailJson = await new Response((detailRes as any).body).json();
          const farm = detailJson.farmProfile ?? detailJson;
          setFarmName(farm.FarmName || farm.farmName || '');
        } catch (e) {
          console.error('Error resolving farm for user', e);
          setHasFarm(false);
        }
      })();
    }, []);

    // keypad handler
    const onDigit = (d: string) => {
        startTimer();
        let clean = amount.replace('.', '');
        if (clean.length >= 5) return; // max 999.99
        if (d === '.') {
            if (amount.includes('.')) return;
            setAmount(amount + '.');
        } else {
            // append and reformat
            if (amount === '0.00') clean = '';
            clean += d;
            while (clean.length < 3) clean = '0' + clean;
            const dollars = clean.slice(0, -2);
            const cents = clean.slice(-2);
            setAmount(`${parseInt(dollars, 10)}.${cents}`);
        }
    };

    // Step 2: fetch balance
    const onCheckout = () => {
        startTimer();
        setError(null);
        setConfirmModalOpen(true);
    };

    // Step 3: verify PIN and handle wrapped/unwrapped responses
    const onConfirmID = async () => {
        setError(null);
        try {
            const res = await get({
                apiName: 'GarrettGrowersAPI',
                path: `/clients/${clientID}`,
            }).response;
            const data = await new Response((res as any).body).json();
            // Handle wrapped vs. unwrapped response
            const client = data.client ?? data;
            // If client is marked inactive, show an error and do not proceed
            if (client.Active === 0 || client.Active === false) {
              setError('ClientID is no longer active with program. Please contact administration');
              return;
            }
            if (!client || !client.ClientID) throw new Error('Client not found');
            setClientBalance(Number(client.Balance));
            setStep(3);
        } catch (e: any) {
            setError(e.message || 'Lookup failed');
        }
    };
    const onConfirmPIN = async () => {
        setError(null);
        try {
            const res = await get({
                apiName: 'GarrettGrowersAPI',
                path: `/clients/${clientID}`,
            }).response;
            const data = await new Response((res as any).body).json();
            const client = data.client ?? data;
            if (String(client.PIN) !== pin) {
                setError('Incorrect PIN (birth year).');
            } else {
                setStep(4);
            }
        } catch (e: any) {
            setError(e.message || 'Lookup failed');
        }
    };

    // Step 4: perform charge
    const onCharge = async () => {
      setError(null);
      const amt = parseFloat(amount);
      if (clientBalance === null || farmID === null) return;
      if (amt > clientBalance) {
        setStep(5);
        return;
      }
      const newBal = clientBalance - amt;
      try {
        // Update client balance
        await put({
          apiName: 'GarrettGrowersAPI',
          path: `/clients/${clientID}`,
          options: {
            body: JSON.stringify({ ClientID: clientID, Balance: newBal, PIN: pin }),
            headers: { 'Content-Type': 'application/json' },
          },
        }).response;
        // Create transaction record
        await post({
          apiName: 'GarrettGrowersAPI',
          path: '/transactions',
          options: {
            body: JSON.stringify({
              Total: amt,
              TransactionDate: new Date().toISOString(),
              FarmID: farmID,
              ClientID: clientID
            }),
            headers: { 'Content-Type': 'application/json' },
          },
        }).response;
        // On success
        setClientBalance(newBal);
        setStep(5);
      } catch (e: any) {
        setError('Transaction failed. Please contact the farm.');
      }
    };

    if (hasFarm === null) {
      return <Container size="xs" style={{ textAlign: 'center' }}><Text>Loading...</Text></Container>;
    }
    if (hasFarm === false) {
      return <Container size="xs" style={{ textAlign: 'center' }}><Text>No currently logged in farm</Text></Container>;
    }

    return (
        <>
        <Modal
          opened={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title="Confirm Amount"
          centered
        >
          <Text>Charge amount: ${amount}</Text>
          <Group mt="md" style={{ justifyContent: 'space-between' }}>
            <Button onClick={() => { startTimer(); setConfirmModalOpen(false); }}>Cancel</Button>
            <Button onClick={() => {
                startTimer();
                setConfirmModalOpen(false);
                setStep(2);
            }}>
              Confirm
            </Button>
          </Group>
        </Modal>
        <Container size="xs" style={{ textAlign: 'center', position: 'relative' }}>
            <Title order={2} mb="sm">{farmName}</Title>
            {step !== 1 && timeLeft <= 30 && (
              <Badge color="red" variant="outline" mb="md">
                Inactivity timeout in {timeLeft}s
              </Badge>
            )}

            {step === 1 && (
                <>
                    <Title order={3}>Enter Amount</Title>
                    <Text size="xl">${amount}</Text>
                    <Grid mt="md">
                        {keypad.map((d, i) => (
                            <Grid.Col span={4} key={i}>
                                {d === '' ? (
                                    // empty placeholder to maintain grid alignment
                                    <Box />
                                ) : (
                                    <Button
                                        fullWidth
                                        size="xl"
                                        color={d === 'C' ? 'red' : undefined}
                                        onClick={() => (d === 'C' ? onClear() : onDigit(d))}
                                    >
                                        {d}
                                    </Button>
                                )}
                            </Grid.Col>
                        ))}
                    </Grid>
                    <Group mt="md" style={{ justifyContent: 'space-between' }}>
                        <Button onClick={onCheckout}>Check Out</Button>
                    </Group>
                </>
            )}

            {step === 2 && (
                <>
                    <Title order={3}>Enter Client ID</Title>
                    <Text size="xl">{clientID || '____'}</Text>
                    <Grid mt="md">
                      {keypad.map((d, i) => (
                        <Grid.Col span={4} key={i}>
                          {d === '' ? (
                            <Box />
                          ) : (
                            <Button
                              fullWidth
                              size="xl"
                              color={d === 'C' ? 'red' : undefined}
                              onClick={() => {
                                if (d === 'C') {
                                  setClientID('');
                                } else {
                                  setClientID(clientID + d);
                                }
                              }}
                            >
                              {d}
                            </Button>
                          )}
                        </Grid.Col>
                      ))}
                    </Grid>
                    <Group mt="md" style={{ justifyContent: 'space-between' }}>
                        <Button color="red" onClick={() => setStep(1)}>Cancel</Button>
                        <Button onClick={onConfirmID}>Confirm</Button>
                    </Group>
                    {error && <Text color="red">{error}</Text>}
                </>
            )}

            {step === 3 && (
                <>
                    <Title order={3}>Enter PIN (Birth Year)</Title>
                    <Text size="xl">{pin.padEnd(4, '_')}</Text>
                    <Grid mt="md">
                      {keypad.map((d, i) => (
                        <Grid.Col span={4} key={i}>
                          {d === '' ? (
                            <Box />
                          ) : (
                            <Button
                              fullWidth
                              size="xl"
                              color={d === 'C' ? 'red' : undefined}
                              onClick={() => {
                                if (d === 'C') {
                                  setPin('');
                                } else if (pin.length < 4) {
                                  setPin(pin + d);
                                }
                              }}
                            >
                              {d}
                            </Button>
                          )}
                        </Grid.Col>
                      ))}
                    </Grid>
                    <Group mt="md" style={{ justifyContent: 'space-between' }}>
                        <Button color="red" onClick={() => setStep(2)}>Cancel</Button>
                        <Button onClick={onConfirmPIN}>Confirm</Button>
                    </Group>
                    {error && <Text color="red">{error}</Text>}
                </>
            )}

            {step === 4 && (
                <>
                    <Title order={3}>Ready to Charge</Title>
                    <Text>Client: {clientID}</Text>
                    <Text>Balance: ${clientBalance?.toFixed(2)}</Text>
                    <Text>Charge: ${parseFloat(amount).toFixed(2)}</Text>
                    <Text>Remaining: ${(clientBalance! - parseFloat(amount)).toFixed(2)}</Text>
                    <Group mt="md">
                        <Button onClick={() => setStep(3)}>Back</Button>
                        <Button onClick={onCharge}>Confirm</Button>
                    </Group>
                    {error && <Text color="red" mt="sm">{error}</Text>}
                </>
            )}

            {step === 5 && (
                <>
                    {parseFloat(amount) <= (clientBalance ?? 0) ? (
                        <>
                            <Title order={3}>Success!</Title>
                            <Text>Charged ${parseFloat(amount).toFixed(2)} to {clientID}</Text>
                            <Text>Remaining Balance: ${clientBalance?.toFixed(2)}</Text>
                        </>
                    ) : (
                        <>
                            <Title order={3}>Insufficient Funds</Title>
                            <Text>You do not have enough balance.</Text>
                        </>
                    )}
                    <Group mt="lg">
                        <Button color="green" onClick={resetAll}>
                            New Purchase
                        </Button>
                    </Group>
                </>
            )}
        </Container>
        </>
    );
}