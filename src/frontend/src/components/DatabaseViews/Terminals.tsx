import React, { useState, useEffect } from 'react';
import {
    Container, Table, ScrollArea, Loader,
    Text, Title, Select, Button, Modal, TextInput,
} from '@mantine/core';
import { get, post } from 'aws-amplify/api';

export default function Terminals() {
    const [locations, setLocations] = useState<{value:string,label:string}[]>([]);
    const [devices,   setDevices]   = useState<any[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [genModal,  setGenModal]  = useState(false);
    const [selLoc,    setSelLoc]    = useState<string>('');
    const [newName,   setNewName]   = useState('');

    // fetch Square locations & devices
    useEffect(() => {
        (async () => {
            setLoading(true);
            const locRes = await get({ apiName:'POSAPI', path:'/square/locations' }).response;
            const locs   = await new Response((locRes as any).body).json();
            setLocations(locs.map((l:any)=>({ value:l.id, label:l.name })));

            const devRes = await get({ apiName:'POSAPI', path:'/square/devices' }).response;
            const devs   = await new Response((devRes as any).body).json();
            setDevices(devs);
            setLoading(false);
        })();
    }, []);

    const generate = async () => {
        await post({
            apiName:'POSAPI',
            path:'/square/devicecodes',
            options:{
                body: JSON.stringify({ locationId: selLoc, name: newName }),
                headers:{ 'Content-Type':'application/json' }
            }
        }).response.then(async res=>{
            const dc = await new Response((res as any).body).json();
            alert(`Device code:\n${dc.deviceCode}\nExpires: ${dc.expiresAt}`);
            setGenModal(false);
        }).catch(e=>alert(e.message));
    };

    if (loading) return <Loader />;

    return (
        <Container>
            <Title order={2}>Square Terminals</Title>
            <Button onClick={()=>setGenModal(true)}>Generate Device Code</Button>
            <ScrollArea style={{ height:300 }}>
                <Table striped highlightOnHover>
                    <thead><tr>
                        <th>ID</th><th>Name</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                    {devices.map(d=>(
                        <tr key={d.id}>
                            <td>{d.id}</td>
                            <td>{d.name}</td>
                            <td>{d.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </ScrollArea>

            <Modal opened={genModal} onClose={()=>setGenModal(false)} title="New Device Code">
                <Select
                    label="Square Location"
                    data={locations}
                    value={selLoc}
                    onChange={(value) => setSelLoc(value || '')}
                    mb="sm"
                />
                <TextInput
                    label="Code Name"
                    placeholder="My Kiosk #1"
                    value={newName}
                    onChange={e=>setNewName(e.currentTarget.value)}
                    mb="sm"
                />
                <Button fullWidth onClick={generate}>Generate</Button>
            </Modal>
        </Container>
    );
}