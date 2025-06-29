import React from "react";
import { Box,Card, Title } from '@mantine/core';
import Locations from "@/components/DatabaseViews/Locations";

export default function LocationsPage() {
    return (
        <Card>
            {/*<Title my="xl">Garrett Growers Dashboard</Title>*/}
            <Locations/>
        </Card>
    )
}
