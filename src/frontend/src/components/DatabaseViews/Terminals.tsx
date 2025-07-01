import React, { useState, useEffect } from 'react';
import { get, post } from 'aws-amplify/api';
import {
    Container, Table, ScrollArea, Loader,
    Text, Title, Select, Button, Modal, TextInput,
} from '@mantine/core';

export default function Terminals() {
    const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [genModal, setGenModal] = useState(false);
    const [selLoc, setSelLoc] = useState<string>('');
    const [newName, setNewName] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [generatedExpires, setGeneratedExpires] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);

            // fetch locations
            const locRes: any = await get({ apiName: 'POSAPI', path: '/square/locations' }).response;
            const locJson = await new Response(locRes.body).json();
            const locList = Array.isArray(locJson) ? locJson : locJson.locations || [];
            setLocations(locList.map((l: any) => ({ value: l.id, label: l.name })));

            // fetch devices
            const devRes: any = await get({ apiName: 'POSAPI', path: '/square/devices' }).response;
            const devJson = await new Response(devRes.body).json();
            const devList = Array.isArray(devJson) ? devJson : devJson.data || devJson.devices || [];
            setDevices(devList);

            setLoading(false);
        })();
    }, []);

    const generate = async () => {
        try {
            const postRes = await post({
                apiName: 'POSAPI',
                path: '/square/devicecodes',
                options: {
                    body: JSON.stringify({ locationId: selLoc, name: newName }),
                    headers: { 'Content-Type': 'application/json' },
                },
            }).response;
            const resp = await new Response((postRes as any).body).json();
            const deviceCodeObj = resp.deviceCode || resp.device_code || resp;
            setGeneratedCode(deviceCodeObj.code);
            setGeneratedExpires(deviceCodeObj.pairBy || deviceCodeObj.expiresAt);
        } catch (e: any) {
            alert(e.message || 'Failed to generate device code');
        }
    };

    if (loading) return <Loader />;

    return (
        <Container fluid>
            <Title order={2} mb="lg">Square Terminals</Title>
            <Button mb="md" onClick={() => setGenModal(true)}>Generate Device Code</Button>

            <ScrollArea style={{ height: 400 }}>
                <Table
                    striped
                    highlightOnHover
                    style={{ width: '100%' }}
                    horizontalSpacing="lg"
                    verticalSpacing="lg"
                >
                    <thead>
                    <tr>
                        <th style={{ padding: '20px' }}>SN</th>
                        <th style={{ padding: '20px' }}>Type</th>
                        <th style={{ padding: '20px' }}>Name</th>
                        <th style={{ padding: '20px' }}>Device Code ID</th>
                        <th style={{ padding: '20px' }}>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {devices.map((d) => {
                        // strip prefix
                        const sn = typeof d.id === 'string' ? d.id.replace(/^device:/, '') : d.id;
                        // find Terminal API component
                        const terminalApp = d.components?.find((c: any) =>
                            c.applicationDetails?.applicationType === 'TERMINAL_API'
                        );
                        const deviceCodeId = terminalApp?.applicationDetails?.deviceCodeId || '—';
                        const statusCategory = d.status?.category || 'Unknown';
                        const type = d.attributes?.type || '—';
                        const name = d.attributes?.name || '—';

                        return (
                            <tr key={d.id}>
                                <td style={{ padding: '20px' }}>{sn}</td>
                                <td style={{ padding: '20px' }}>{type}</td>
                                <td style={{ padding: '20px' }}>{name}</td>
                                <td style={{ padding: '20px' }}>{deviceCodeId}</td>
                                <td style={{ padding: '20px' }}>{statusCategory}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </Table>
            </ScrollArea>

            <Modal
                opened={genModal}
                onClose={() => {
                    setGenModal(false);
                    setGeneratedCode(null);
                    setGeneratedExpires(null);
                    setSelLoc('');
                    setNewName('');
                }}
                title="New Device Code"
            >
                {!generatedCode ? (
                    <>
                        <Select
                            label="Square Location"
                            data={locations}
                            value={selLoc}
                            onChange={(v) => setSelLoc(v || '')}
                            mb="sm"
                        />
                        <TextInput
                            label="Code Name"
                            placeholder="My Kiosk #1"
                            value={newName}
                            onChange={(e) => setNewName(e.currentTarget.value)}
                            mb="sm"
                        />
                        <Button fullWidth onClick={generate}>Generate</Button>
                    </>
                ) : (
                    <>
                        <Text size="lg" mb="md">Device code:</Text>
                        <Text fw={700} size="xl" mb="sm">{generatedCode}</Text>
                        <Text size="sm" mb="md">
                            Expires at: {new Date(generatedExpires!).toLocaleString()}
                        </Text>
                        <Button fullWidth onClick={() => {
                            setGenModal(false);
                            setGeneratedCode(null);
                            setGeneratedExpires(null);
                            setSelLoc('');
                            setNewName('');
                        }}>
                            Close
                        </Button>
                    </>
                )}
            </Modal>
        </Container>
    );
}