---
"@stackra/peripherals": minor
---

`EcrCardTerminalDriver` (`./desktop`, driver name `ecr` of `peripherals.cardTerminal`): a semi-integrated card terminal
on the shop's network (`tcp://<host>:<port>`), reporting ready, busy or offline, and the byte link the payments ECR
driver speaks through (STX/ETX/LRC frames, ACK/NAK, resends). It never reads the payload (ADR 0377 decision 1).
`DriverName<CardTerminal>` is now `"memory" | "ecr"`. Certification pending (batch stackra-35).
