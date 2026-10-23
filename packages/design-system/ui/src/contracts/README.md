# src/contracts

The `./contracts` entry: the leaf of @stackra/ui (ADR 0294 decision 15). It holds `ports/` (abstract classes
that extend `Port`), `enums/` and `types/`, and imports nothing else from the package; `core/` builds on it.

`./contracts` names the stand-in barrel `index.ts` (the shared enums, the provider types, the shared overlay and feedback contracts of wave 4 (open state, dismissal, placement, tone and icon), the shared collection contracts of wave 5 (items, selection, sort) and the props contracts of
Icon, Text, Heading, Button, IconButton, CloseButton, Link, Surface, Card, Separator, Chip, StatusBadge, Badge, Avatar, Spinner, Skeleton, SkeletonGroup, Checkbox, CheckboxGroup, ComboBox, Description, FieldError, Form, FormField, FormSection, InputGroup, Label, RadioGroup, SearchField, Select, Switch, TagGroup, TextArea and TextField, and the wave 4 Modal, Drawer, AlertDialog, Menu, ActionMenu, Popover, Tooltip, Alert, Toast, confirmation and progress contracts) until `stackra gen` writes the entry barrels (STA-339).
