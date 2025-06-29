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
    Popover,
    TextInput,
    Badge
} from '@mantine/core';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';

// Numeric keypad layout
const keypad = ['1','2','3','4','5','6','7','8','9','','0','C'];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function POS() {
    const [step, setStep] = useState<Step>(1);
    const [items, setItems] = useState<number[]>([]);
    const [newPrice, setNewPrice] = useState('0.00');
    const [timeLeft, setTimeLeft] = useState(45);
    const [signupTimeout, setSignupTimeout] = useState<number>(20);

    const [locationID, setLocationID] = useState<string>('');

    // Signup form state
    const [showSignupPopover, setShowSignupPopover] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const inactivityRef = useRef<NodeJS.Timeout>();
    const signupRef = useRef<NodeJS.Timeout>();

    // Reset app
    const resetAll = () => {
        setStep(1);
        setItems([]);
        setNewPrice('0.00');
        setTimeLeft(45);
        clearInterval(inactivityRef.current);
        clearInterval(signupRef.current);
        setShowSignupPopover(false);
        setSignupTimeout(20);
        setName(''); setEmail(''); setPhone('');
    };

    // Inactivity timer
    const startInactivity = () => {
        clearInterval(inactivityRef.current);
        setTimeLeft(45);
        inactivityRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) { resetAll(); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    // Signup decision timer
    const startSignupTimer = () => {
        clearInterval(signupRef.current);
        setSignupTimeout(20);
        signupRef.current = setInterval(() => {
            setSignupTimeout((t) => {
                if (t <= 1) { resetAll(); return 0; }
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

    // Reset inactivity on step change
    useEffect(() => {
        startInactivity();
        return () => clearInterval(inactivityRef.current);
    }, [step]);

    // Start signup timer on signup prompt
    useEffect(() => {
        if (step === 5) startSignupTimer();
        return () => clearInterval(signupRef.current);
    }, [step]);

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
    };

    const total = items.reduce((a,b) => a + b, 0);

    // Complete transaction
    const completePayment = async (method: string) => {
        try {
            const txRes = await post({ apiName: 'POSAPI', path: '/transactions', options: { body: JSON.stringify({ Total: total, TransactionDate: new Date().toISOString(), LocationID: locationID }), headers:{'Content-Type':'application/json'} } }).response;
            const txJson = await new Response((txRes as any).body).json();
            const txID = txJson.TransactionID;
            await post({ apiName: 'POSAPI', path: '/payments', options: { body: JSON.stringify({ TransactionID: txID, Amount: total, PaymentMethod: method }), headers:{'Content-Type':'application/json'} } }).response;
        } catch {}
        setStep(5);
    };

    return (
        <Container size="xs" style={{ textAlign: 'center', position: 'relative' }}>
            {step !== 1 && (
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
                        <Button onClick={() => setStep(2)}>Checkout</Button>
                    </Group>
                    <Text mt="md">Items: {items.map((v,i) => `$${v.toFixed(2)}`).join(', ')}</Text>
                    <Text mt="sm">Total: ${total.toFixed(2)}</Text>
                </>
            )}

            {step === 2 && (
                <>
                    <Title order={3}>Select Payment Method</Title>
                    <Group mt="md">
                        <Button onClick={() => setStep(3)}>Cash</Button>
                        <Button onClick={() => setStep(4)}>Credit, Debit or Apple Pay</Button>
                    </Group>
                </>
            )}

            {step === 3 && (
                <>
                    <Title order={4}>Please deposit:</Title>
                    <Text size="xl" color="green">${total.toFixed(2)}</Text>
                    <Text>into the cash box</Text>
                    <Group mt="md">
                        <Button onClick={() => completePayment('Cash')}>Continue</Button>
                    </Group>
                </>
            )}

            {step === 4 && (
                <>
                    <Title order={4}>Please complete transaction on terminal</Title>
                    <Button mt="md" onClick={() => completePayment('Card')}>Continue</Button>
                </>
            )}

            {step === 5 && (
                <>
                    <Title order={3}>Thank you for your purchase!</Title>
                    <Text>Sign up for emails on new inventory and discounts?</Text>
                    <Text mt="sm">{signupTimeout}s to decide</Text>
                    <Group mt="md">
                        <Button onClick={() => setStep(6)}>Yes</Button>
                        <Button onClick={resetAll}>No</Button>
                    </Group>
                </>
            )}

            {step === 6 && (
                <Popover opened onClose={resetAll} width={300} position="bottom" withArrow>
                    <Popover.Target>
                        <Button fullWidth mb="md">Enter Details</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} mb="sm" />
                        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} mb="sm" />
                        <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} mb="sm" />
                        <Button fullWidth onClick={resetAll}>Submit</Button>
                    </Popover.Dropdown>
                </Popover>
            )}
        </Container>
    );
}
