---
"@stackra/peripherals": minor
---

Add the `LabelPrinter`, `CustomerDisplay` and `CardTerminal` ports (ADR 0339) with memory drivers, the `channel`
customer display driver and `listenCustomerDisplay`, the desktop `ZplLabelPrinterDriver` and `PrintLabelBridge`
(`peripherals.label.print`), `parseEmbeddedBarcode` for weight- and price-embedded barcodes read through market-pack
layouts, and `PeripheralsConfig` fields `labelPrinter`, `customerDisplay`, `cardTerminal` and `labelPrinterAddress`.
