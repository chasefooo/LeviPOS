import React, { useEffect, useState } from "react";
import { Avatar, Text } from "@mantine/core";
import classes from "./PopOverTargetContent.module.css";
import { fetchUserAttributes } from "aws-amplify/auth";

interface UserAttributes {
    given_name?: string;
    family_name?: string;
    email?: string;
}

export default function PopOverTargetContent() {
    const [attributes, setAttributes] = useState<UserAttributes>({});

    useEffect(() => {
        async function loadAttributes() {
            try {
                const userAttributes = await fetchUserAttributes();
                console.log("User attributes:", userAttributes);
                setAttributes(userAttributes);
            } catch (error) {
                console.error("Error fetching user attributes:", error);
            }
        }
        loadAttributes();
    }, []);

    const fullName = `${attributes.given_name || ""} ${attributes.family_name || ""}`.trim();
    const email = attributes.email || "";
    const initials =
        (attributes.given_name ? attributes.given_name.charAt(0) : "") +
        (attributes.family_name ? attributes.family_name.charAt(0) : "");

    return (
        <div className={classes.contentWrapper}>
            <Avatar color="green" radius="lg">
                {initials.toUpperCase()}
            </Avatar>
            <div>
                <Text style={{ fontWeight: "bold" }} size="md">
                    {fullName}
                </Text>
                <Text size="xs">{email}</Text>
            </div>
        </div>
    );
}