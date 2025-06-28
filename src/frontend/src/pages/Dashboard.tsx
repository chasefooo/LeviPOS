import React from "react";
import { Box,Card, Title } from '@mantine/core';
import POS from "@/components/POS/POS";

export default function Dashboard() {
  return (
      <Card>
        {/*<Title my="xl">Garrett Growers Dashboard</Title>*/}
        <POS/>
    </Card>
  )
}
