/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Table` (@stackra-pro/ui): a plain table, the secondary variant,
 *          controlled sorting, multiple selection with a disabled row, and an empty body.
 * Boundary: presentation and local demo state only; the table is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { Table, type TableProps } from "@stackra-pro/ui/native";
import { useMemo, useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Columns and rows",
    description: "A header of columns over a body of rows; a wide table scrolls sideways.",
  },
  secondary: {
    title: "Secondary variant",
    description:
      '`variant="secondary"` is flat, with a rounded header band and rows divided by borders.',
  },
  sorting: {
    title: "Sorting",
    description:
      "Sorting is controlled: the table reports the column and direction and you reorder the rows.",
    sortedBy: "Sorted by:",
    ascending: "ascending",
    descending: "descending",
  },
  selection: {
    title: "Multiple selection",
    description:
      '`selectionMode="multiple"` adds the checkbox cells; the third row is in `disabledKeys`.',
    selected: "Selected rows:",
    none: "none",
  },
  empty: {
    title: "Empty body",
    description: "`renderEmptyState` fills a body with no rows.",
    message: "No members yet.",
  },
  columns: {
    name: "Name",
    role: "Role",
    status: "Status",
    tasks: "Open tasks",
  },
} as const;

type SortDescriptor = NonNullable<TableProps["sortDescriptor"]>;

const MEMBERS = [
  { id: "1", name: "Ava Thompson", role: "Design", status: "Active", tasks: 4 },
  { id: "2", name: "Liam Nguyen", role: "Engineering", status: "Paused", tasks: 9 },
  { id: "3", name: "Maya Patel", role: "Product", status: "Active", tasks: 2 },
  { id: "4", name: "Omar Farouk", role: "Support", status: "Active", tasks: 6 },
];

/** The Table page: one section per feature, in a scrollable screen. */
export function TableScreen() {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["1"]);

  const sortedMembers = useMemo(() => {
    const sorted = [...MEMBERS].sort((a, b) =>
      sortDescriptor.column === "tasks" ? a.tasks - b.tasks : a.name.localeCompare(b.name),
    );
    return sortDescriptor.direction === "descending" ? sorted.toReversed() : sorted;
  }, [sortDescriptor]);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column flex={1.3}>{STRINGS.columns.name}</Table.Column>
                <Table.Column>{STRINGS.columns.role}</Table.Column>
                <Table.Column width={90}>{STRINGS.columns.status}</Table.Column>
              </Table.Header>
              <Table.Body>
                {MEMBERS.map((member) => (
                  <Table.Row key={member.id} id={member.id}>
                    <Table.Cell>{member.name}</Table.Cell>
                    <Table.Cell>{member.role}</Table.Cell>
                    <Table.Cell>{member.status}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Section>

      <Section title={STRINGS.secondary.title} description={STRINGS.secondary.description}>
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column flex={1.3}>{STRINGS.columns.name}</Table.Column>
                <Table.Column>{STRINGS.columns.role}</Table.Column>
                <Table.Column width={90}>{STRINGS.columns.status}</Table.Column>
              </Table.Header>
              <Table.Body>
                {MEMBERS.map((member) => (
                  <Table.Row key={member.id} id={member.id}>
                    <Table.Cell>{member.name}</Table.Cell>
                    <Table.Cell>{member.role}</Table.Cell>
                    <Table.Cell>{member.status}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Section>

      <Section title={STRINGS.sorting.title} description={STRINGS.sorting.description}>
        <Table sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column id="name" allowsSorting flex={1.3}>
                  {STRINGS.columns.name}
                </Table.Column>
                <Table.Column id="tasks" allowsSorting>
                  {STRINGS.columns.tasks}
                </Table.Column>
              </Table.Header>
              <Table.Body items={sortedMembers}>
                {(member) => (
                  <Table.Row id={member.id}>
                    <Table.Cell>{member.name}</Table.Cell>
                    <Table.Cell>{member.tasks}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.sorting.sortedBy} ${
            sortDescriptor.column === "tasks" ? STRINGS.columns.tasks : STRINGS.columns.name
          }, ${
            sortDescriptor.direction === "descending"
              ? STRINGS.sorting.descending
              : STRINGS.sorting.ascending
          }`}
        </Text>
      </Section>

      <Section title={STRINGS.selection.title} description={STRINGS.selection.description}>
        <Table
          selectionMode="multiple"
          defaultSelectedKeys={["1"]}
          disabledKeys={["3"]}
          onSelectionChange={(keys) => setSelectedKeys([...keys].map(String))}
        >
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.SelectAllCell />
                <Table.Column flex={1.3}>{STRINGS.columns.name}</Table.Column>
                <Table.Column>{STRINGS.columns.role}</Table.Column>
              </Table.Header>
              <Table.Body items={MEMBERS}>
                {(member) => (
                  <Table.Row id={member.id}>
                    <Table.SelectionCell />
                    <Table.Cell>{member.name}</Table.Cell>
                    <Table.Cell>{member.role}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.selection.selected} ${
            selectedKeys.length > 0 ? selectedKeys.join(", ") : STRINGS.selection.none
          }`}
        </Text>
      </Section>

      <Section title={STRINGS.empty.title} description={STRINGS.empty.description}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column>{STRINGS.columns.name}</Table.Column>
                <Table.Column>{STRINGS.columns.role}</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <Text type="small" tone="muted" className="py-6 text-center">
                    {STRINGS.empty.message}
                  </Text>
                )}
              />
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Section>
    </Screen>
  );
}
