// src/components/Locations.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  Text,
  Button,
  Popover,
  TextInput,
  Group,
  Loader
} from '@mantine/core';
import { get, post, put } from 'aws-amplify/api';

interface Location {
  LocationID: number;
  Name: string;
  Address: string;
  Phone: string;
  SquareLocation: string;
  Active: number;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, setOpened] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // helper to refresh the list
  const fetchLocations = async () => {
    try {
      const res = await get({ apiName: 'POSAPI', path: '/locations' }).response;
      const list = await new Response((res as any).body).json();
      setLocations(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLocations();
      setLoading(false);
    })();
  }, []);

  const openEditor = (loc: Location) => {
    setEditing({ ...loc });
    setIsNew(false);
    setOpened(true);
  };

  const saveLocation = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) {
        await post({
          apiName: 'POSAPI',
          path: '/locations',
          options: {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
          },
        }).response;
      } else {
        await put({
          apiName: 'POSAPI',
          path: `/locations/${editing.LocationID}`,
          options: {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
          },
        }).response;
      }
      // refresh list and close popover
      await fetchLocations();
      setOpened(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Loader />
      </Container>
    );
  }

  const rows = locations.map((loc) => (
    <tr key={loc.LocationID}>
      <td>{loc.LocationID}</td>
      <td>{loc.Name}</td>
      <td>{loc.Address}</td>
      <td>
        <Button size="xs" onClick={() => openEditor(loc)}>
          Edit
        </Button>
      </td>
    </tr>
  ));

  return (
    <Container>
      <Group style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => {
          setEditing({ LocationID: 0, Name: '', Address: '', Phone: '', SquareLocation: '', Active: 1 });
          setIsNew(true);
          setOpened(true);
        }}>
          Add Location
        </Button>
      </Group>
      <Text size="xl" style={{ fontWeight: 500, marginBottom: 16 }}>
        Locations
      </Text>
      <Table style={{ width: '80%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th />
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>

      <Popover
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        withArrow
      >
        <Popover.Target>
          <div />
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="lg" style={{ fontWeight: 500, marginBottom: 8 }}>
            Edit Location
          </Text>
          {editing && (
            <>
              <TextInput
                label="Name"
                value={editing.Name}
                onChange={(e) =>
                  setEditing({ ...editing, Name: e.currentTarget.value })
                }
                mb="sm"
              />
              <TextInput
                label="Address"
                value={editing.Address}
                onChange={(e) =>
                  setEditing({ ...editing, Address: e.currentTarget.value })
                }
                mb="sm"
              />
              <TextInput
                label="Phone"
                value={editing.Phone}
                onChange={(e) =>
                  setEditing({ ...editing, Phone: e.currentTarget.value })
                }
                mb="sm"
              />
              <TextInput
                label="SquareLocation"
                value={editing.SquareLocation}
                disabled
                mb="sm"
              />
              <Group style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button
                  variant="outline"
                  onClick={() => setOpened(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={saveLocation} loading={saving}>
                  Save
                </Button>
              </Group>
            </>
          )}
        </Popover.Dropdown>
      </Popover>
    </Container>
  );
}