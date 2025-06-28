import { Avatar, Text } from "@mantine/core";
import classes from "./CollapsedUserPopOverContent.module.css";
import { useAuth } from "@/contexts/AuthContext";

export default function CollapsedUserPopOverContent() {
  const { user } = useAuth();
  // Adjust keys if needed; for example, use user.attributes['name'] if that's how full name is stored.
  const fullName = user?.attributes?.name || "";
  const email = user?.attributes?.email || "";

  // Derive initials from fullName, with a fallback if not available.
  const nameParts = fullName.split(" ");
  const firstNameInitial = nameParts[0]?.charAt(0) || "";
  const lastNameInitial = nameParts[1]?.charAt(0) || "";

  return (
      <div className={classes.contentWrapper}>
        <Avatar color="blue" radius="lg">
          {firstNameInitial + lastNameInitial}
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
