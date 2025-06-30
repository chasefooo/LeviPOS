import React from "react";
import { Box,Card, Title } from '@mantine/core';
import Terminals from "@/components/DatabaseViews/Terminals";

export default function TerminalsPage() {
    return (
        <Card>
            {/*<Title my="xl">Garrett Growers Dashboard</Title>*/}
            <Terminals/>
        </Card>
    )
}
