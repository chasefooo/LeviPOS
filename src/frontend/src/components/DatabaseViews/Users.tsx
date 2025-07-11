// src/components/DatabaseViews/Users.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Group,
  Title,
  ScrollArea,
  Table,
  LoadingOverlay,
  Text,
  Checkbox,
  Select,
  Modal,
  Button,
  TextInput,
} from '@mantine/core';
import { get, put, post } from 'aws-amplify/api';

export interface UserRecord {
  username: string;
  given_name?: string;
  family_name?: string;
  groups?: string[];
  location?: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [editAdmin, setEditAdmin] = useState(false);
  const [editLocation, setEditLocation] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [isNewUser, setIsNewUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGivenName, setNewGivenName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await get({ apiName: 'POSAPI', path: '/listcognitouser' }).response;
      const json = await new Response((res as any).body).json();
      const list: any[] = json.users || json;
      const normalized = list.map((u) => ({
        username: u.username,
        given_name: u.given_name,
        family_name: u.family_name,
        groups: u.groups || u.Groups || [],
        location: u['custom:location'] || '',
      }));
      setUsers(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const res = await get({ apiName: 'POSAPI', path: '/locations' }).response;
      const list = await new Response((res as any).body).json();
      const opts = (list || []).map((loc: any) => ({
        value: String(loc.LocationID),
        label: loc.Name,
      }));
      setLocations(opts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, []);

  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditAdmin(user.groups?.includes('Administrator') ?? false);
    setEditLocation(user.location || '');
    setEditModalOpened(true);
  };

  const closeEdit = () => {
    setEditModalOpened(false);
    setSelectedUser(null);
    setIsNewUser(false);
  };

  const openNew = () => {
    setIsNewUser(true);
    setNewUsername('');
    setNewPassword('');
    setNewGivenName('');
    setNewFamilyName('');
    setNewLocation('');
    setEditModalOpened(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNewUser) {
        // Create new user
        const body = JSON.stringify({
          Username: newUsername,
          TemporaryPassword: newPassword,
          given_name: newGivenName,
          family_name: newFamilyName,
          location: newLocation,
        });
        await post({
          apiName: 'POSAPI',
          path: '/listcognitouser',
          options: { body, headers: { 'Content-Type': 'application/json' } },
        }).response;
      } else if (selectedUser) {
        // Update existing user
        const bodyPayload: any = {
          groups: editAdmin ? ['Administrator'] : [],
          'custom:location': editLocation,
        };
        await put({
          apiName: 'POSAPI',
          path: `/listcognitouser/${selectedUser.username}`,
          options: {
            body: JSON.stringify(bodyPayload),
            headers: { 'Content-Type': 'application/json' },
          },
        }).response;
      }
      setEditModalOpened(false);
      setSelectedUser(null);
      setIsNewUser(false);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const rows = users.map((u) => {
    const locLabel = locations.find((l) => l.value === u.location)?.label || '';
    return (
      <tr key={u.username} onClick={() => openEdit(u)} style={{ cursor: 'pointer' }}>
        <td style={{ padding: 16 }}>{u.username}</td>
        <td style={{ padding: 16 }}>{locLabel}</td>
        <td style={{ padding: 16, textAlign: 'center' }}>
          <Checkbox checked={u.groups?.includes('Administrator')} readOnly />
        </td>
      </tr>
    );
  });

  return (
    <Container style={{ position: 'relative', height: '100%' }}>
      <LoadingOverlay visible={loading} />
      <Group style={{ marginBottom: 16 }}>
        <Title order={2}>Users</Title>
        <Button onClick={openNew}>New User</Button>
      </Group>
      <ScrollArea style={{ height: 'calc(100% - 60px)' }}>
        <Table striped highlightOnHover withColumnBorders>
          <thead>
            <tr>
              <th style={{ padding: '16px' }}>Username</th>
              <th style={{ padding: '16px' }}>Location</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Admin</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={editModalOpened}
        onClose={closeEdit}
        title={isNewUser ? 'New User' : 'Edit User'}
      >
        {(isNewUser || selectedUser) && (
          <>
            {isNewUser ? (
              <>
                <TextInput
                  label="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.currentTarget.value)}
                  mb="sm"
                />
                <TextInput
                  label="Temporary Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.currentTarget.value)}
                  mb="sm"
                />
                <TextInput
                  label="Given Name"
                  value={newGivenName}
                  onChange={(e) => setNewGivenName(e.currentTarget.value)}
                  mb="sm"
                />
                <TextInput
                  label="Family Name"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.currentTarget.value)}
                  mb="sm"
                />
              </>
            ) : (
              <>
                <TextInput
                  label="Username"
                  value={selectedUser!.username}
                  disabled
                  mb="sm"
                />
                <Checkbox
                  label="Administrator"
                  checked={editAdmin}
                  onChange={(e) => setEditAdmin(e.currentTarget.checked)}
                  mb="sm"
                />
              </>
            )}
            <Select
              label="Location"
              data={locations}
              value={isNewUser ? newLocation : editLocation}
              onChange={(val) => {
                if (isNewUser) setNewLocation(val || '');
                else setEditLocation(val || '');
              }}
              mb="sm"
              clearable
            />
            <Group style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="outline" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </Container>
  );
}