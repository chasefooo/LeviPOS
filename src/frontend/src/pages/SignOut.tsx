import React from "react";
import { Box,Card, Title } from '@mantine/core';
import SimpleSideBarBottomContent from "@/components/Layout/LayoutTypes/SimpleSideBarBottomContent";

export default function Dashboard() {
    return (
        <Card>
            {/*<Title my="xl">Garrett Growers Dashboard</Title>*/}
            <SimpleSideBarBottomContent/>
        </Card>
    )
}
