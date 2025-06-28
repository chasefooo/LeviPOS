import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Popover,
} from '@mantine/core';
import classes from './SignIn.module.css';
import * as yup from 'yup';
import { useForm, yupResolver } from '@mantine/form';
import { signIn, confirmSignIn } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { showNotification } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // We now also extract refreshUser from AuthContext
  const { user, refreshUser, setUser } = useAuth();

  // State for the "new password required" flow
  const [showNewPasswordPopover, setShowNewPasswordPopover] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Validation schema
  const schema = yup.object().shape({
    user: yup.string().required('Please enter a username'),
    password: yup.string().required('Please enter a password'),
  });

  // Mantine form setup
  const form = useForm({
    initialValues: {
      user: '',
      password: '',
    },
    validate: yupResolver(schema),
  });

  // If AuthContext already has a user, redirect to root so ProtectedRoute can redirect appropriately.
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle the main sign-in flow
  async function handleSubmit(values: { user: string; password: string }) {
    setLoading(true);
    try {
      const normalizedUser = values.user.trim().toLowerCase();
      // Attempt to sign in
      const cognitoUser = await signIn({ username: normalizedUser, password: values.password });
      console.log('Result from signIn:', cognitoUser);

      // Check if Cognito requires a new password
      if (
          cognitoUser.nextStep &&
          cognitoUser.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
      ) {
        // Show the popover for new password entry
        setShowNewPasswordPopover(true);
      } else {
        // Instead of directly setting the user or navigating,
        // call refreshUser to update the AuthContext.
        await refreshUser();
        // Navigate to the root so that ProtectedRoute can handle the redirection.
        navigate('/');
      }
    } catch (error: any) {
      if (error.name === 'UserAlreadyAuthenticatedException') {
        console.log('User already authenticated; reloading page to update context');
        window.location.reload();
        return;
      }
      console.error('Error signing in:', error);
      showNotification({
        title: 'Login Failed',
        message: 'Incorrect user or password.',
        color: 'red',
        icon: <IconAlertCircle />,
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle the new password submission using confirmSignIn
  async function handleNewPasswordSubmit() {
    try {
      if (!newPassword.trim()) {
        throw new Error('New password cannot be empty');
      }
      const updatedUser = await confirmSignIn({ challengeResponse: newPassword } as any);
      console.log('New password confirmed:', updatedUser);
      setShowNewPasswordPopover(false);
      await refreshUser();
      navigate('/');
    } catch (error: any) {
      console.error('Error completing new password:', error);
      showNotification({
        title: 'Update Failed',
        message: 'Could not update password.',
        color: 'red',
        icon: <IconAlertCircle />,
      });
    }
  }

  return (
      <div>
        {/* Popover for new password entry */}
        {showNewPasswordPopover && (
            <div style={{ position: 'fixed', top: 20, left: 0, right: 0, zIndex: 10000 }}>
              <Popover opened onClose={() => setShowNewPasswordPopover(false)}>
                <Popover.Target>
                  <div style={{ width: 0, height: 0 }} />
                </Popover.Target>
                <Popover.Dropdown>
                  <Title order={4} mb="sm">
                    New Password Required<br />
                    Minimum - 8 characters, one upper case and one lower case.
                  </Title>
                  <TextInput
                      label="New Password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.currentTarget.value)}
                  />
                  <Button onClick={handleNewPasswordSubmit} mt="md">
                    Submit New Password
                  </Button>
                </Popover.Dropdown>
              </Popover>
            </div>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <div className={classes.wrapper}>
            <Paper className={classes.form} radius={0} p={30}>
              <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
                Garrett Growers POS Sign In
              </Title>
              <TextInput
                  {...form.getInputProps('user')}
                  name="user"
                  label="Username"
                  withAsterisk
                  placeholder="Your Username"
                  size="md"
              />
              <PasswordInput
                  {...form.getInputProps('password')}
                  name="password"
                  label="Password"
                  placeholder="Your password"
                  mt="md"
                  size="md"
              />
              <Button loading={loading} type="submit" fullWidth mt="xl" size="md">
                Login
              </Button>
            </Paper>
          </div>
        </form>
      </div>
  );
}