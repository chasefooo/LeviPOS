import React from "react";
import { Box,Card, Title } from '@mantine/core';
import Users from "@/components/DatabaseViews/Users";

export default function Userspage() {
    return (
        <Card>
            {/*<Title my="xl">Garrett Growers Dashboard</Title>*/}
            <Users/>
        </Card>
    )
}
