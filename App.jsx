import { useEffect, useMemo, useState } from "react";

const vehicleTypes = [
  "Minivan",
  "Van",
  "Pick Up",
  "Medium Isuzu",
  "Isuzu NPR",
  "Isuzu FSR",
  "Heavy Truck",
];

const VAT_RATE = 0.15;

// VAT is calculated ON TOP of commission, not split out of it.
// commission = trip * rate%  (or weight * rate for heavy)
// vat = commission * VAT_RATE
// totalCharge = commission + vat
function calcVat(commission) {
  const c = Number(commission || 0);
  const vat = c * VAT_RATE;
  const totalCharge = c + vat;
  return { commission: c, vat, totalCharge };
}

const paymentMethods = ["Bank Transfer", "Deposit", "Mobile Transfer", "Cash", "Other"];
const clientSettlementMethods = ["Bill With Job", "Deduct From Deposit", "Move To A/R"];
const driverSettlementMethods = ["Deduct From Payout", "Deduct From Deposit", "Future Deduction"];

const STORAGE_KEYS = {
  clients: "erp_clients",
  drivers: "erp_drivers",
  jobs: "erp_jobs",
  clientDepositLedger: "erp_clientDepositLedger",
  driverDepositLedger: "erp_driverDepositLedger",
  clientArLedger: "erp_clientArLedger",
  driverArLedger: "erp_driverArLedger",
  clientCounter: "erp_clientCounter",
  driverCounter: "erp_driverCounter",
  jobCounter: "erp_jobCounter",
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanNumber(value) {
  return Number(String(value || "").replace(/,/g, "").trim()) || 0;
}

function formatId(prefix, number, length = 3) {
  return `${prefix}-${String(number).padStart(length, "0")}`;
}

function loadStoredValue(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [jobCounter, setJobCounter] = useState(() => loadStoredValue(STORAGE_KEYS.jobCounter, 1));
  const [jobNo, setJobNo] = useState(
    () => `JOB-${String(loadStoredValue(STORAGE_KEYS.jobCounter, 1)).padStart(4, "0")}`
  );
  const [jobDate, setJobDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [tripValue, setTripValue] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [clientMode, setClientMode] = useState("Normal");
  const [driverMode, setDriverMode] = useState("Normal");
  const [clientSettlementMethod, setClientSettlementMethod] = useState("Bill With Job");
  const [driverSettlementMethod, setDriverSettlementMethod] = useState("Deduct From Payout");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [driverCommissionRate, setDriverCommissionRate] = useState("15");
  const [clientCommissionRate, setClientCommissionRate] = useState("10");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [estimatedDistance, setEstimatedDistance] = useState("");
  const [actualDistance, setActualDistance] = useState("");
  const [goodsType, setGoodsType] = useState("");

  const [showClientForm, setShowClientForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showClientDepositForm, setShowClientDepositForm] = useState(false);
  const [showDriverDepositForm, setShowDriverDepositForm] = useState(false);
  const [showClientSettlementForm, setShowClientSettlementForm] = useState(false);
  const [showDriverSettlementForm, setShowDriverSettlementForm] = useState(false);

  const [clientCounter, setClientCounter] = useState(() => loadStoredValue(STORAGE_KEYS.clientCounter, 1));
  const [driverCounter, setDriverCounter] = useState(() => loadStoredValue(STORAGE_KEYS.driverCounter, 1));

  const [clientForm, setClientForm] = useState(() => ({
    clientId: formatId("CLT", loadStoredValue(STORAGE_KEYS.clientCounter, 1)),
    clientName: "",
    phone: "",
    commissionRate: "10",
    clientMode: "Normal",
    clientSettlementMethod: "Bill With Job",
    openingDepositBalance: "0",
  }));

  const [driverForm, setDriverForm] = useState(() => ({
    driverId: formatId("DRV", loadStoredValue(STORAGE_KEYS.driverCounter, 1)),
    driverName: "",
    phone: "",
    vehicleType: "",
    plateNo: "",
    commissionRate: "15",
    driverMode: "Normal",
    driverSettlementMethod: "Deduct From Payout",
    openingDepositBalance: "0",
  }));

  const [clientDepositForm, setClientDepositForm] = useState({
    depositDate: "", clientName: "", amount: "", reference: "", note: "",
  });
  const [driverDepositForm, setDriverDepositForm] = useState({
    depositDate: "", driverName: "", amount: "", reference: "", note: "",
  });
  const [clientSettlementForm, setClientSettlementForm] = useState({
    settlementDate: "", clientName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "",
  });
  const [driverSettlementForm, setDriverSettlementForm] = useState({
    settlementDate: "", driverName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "",
  });

  const [clients, setClients] = useState(() => loadStoredValue(STORAGE_KEYS.clients, []));
  const [drivers, setDrivers] = useState(() => loadStoredValue(STORAGE_KEYS.drivers, []));
  const [jobs, setJobs] = useState(() => loadStoredValue(STORAGE_KEYS.jobs, []));
  const [clientDepositLedger, setClientDepositLedger] = useState(() => loadStoredValue(STORAGE_KEYS.clientDepositLedger, []));
  const [driverDepositLedger, setDriverDepositLedger] = useState(() => loadStoredValue(STORAGE_KEYS.driverDepositLedger, []));
  const [clientArLedger, setClientArLedger] = useState(() => loadStoredValue(STORAGE_KEYS.clientArLedger, []));
  const [driverArLedger, setDriverArLedger] = useState(() => loadStoredValue(STORAGE_KEYS.driverArLedger, []));

  const [clientSearch, setClientSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  const [clientError, setClientError] = useState("");
  const [driverError, setDriverError] = useState("");
  const [jobError, setJobError] = useState("");
  const [clientDepositError, setClientDepositError] = useState("");
  const [driverDepositError, setDriverDepositError] = useState("");
  const [clientSettlementError, setClientSettlementError] = useState("");
  const [driverSettlementError, setDriverSettlementError] = useState("");
  const [clientInfo, setClientInfo] = useState("");
  const [driverInfo, setDriverInfo] = useState("");
  const [clientDepositInfo, setClientDepositInfo] = useState("");
  const [driverDepositInfo, setDriverDepositInfo] = useState("");
  const [clientSettlementInfo, setClientSettlementInfo] = useState("");
  const [driverSettlementInfo, setDriverSettlementInfo] = useState("");

  const [editingJobNo, setEditingJobNo] = useState(null);

  // Audit helpers — stamp every saved record with a created/updated timestamp
  function auditStamp(existing = {}) {
    const now = new Date().toISOString();
    return existing.createdAt
      ? { ...existing, updatedAt: now }
      : { ...existing, createdAt: now };
  }
  function auditNew() {
    return { createdAt: new Date().toISOString() };
  }

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.clientDepositLedger, JSON.stringify(clientDepositLedger)); }, [clientDepositLedger]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.driverDepositLedger, JSON.stringify(driverDepositLedger)); }, [driverDepositLedger]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.clientArLedger, JSON.stringify(clientArLedger)); }, [clientArLedger]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.driverArLedger, JSON.stringify(driverArLedger)); }, [driverArLedger]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.clientCounter, JSON.stringify(clientCounter)); }, [clientCounter]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.driverCounter, JSON.stringify(driverCounter)); }, [driverCounter]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.jobCounter, JSON.stringify(jobCounter));
    setJobNo(`JOB-${String(jobCounter).padStart(4, "0")}`);
  }, [jobCounter]);

  useEffect(() => {
    const found = clients.find((c) => normalizeText(c.clientName) === normalizeText(clientName));
    if (found) {
      setClientMode(found.clientMode || "Normal");
      setClientCommissionRate(found.commissionRate || "10");
      setClientSettlementMethod(found.clientSettlementMethod || "Bill With Job");
    } else {
      setClientMode("Normal");
      setClientCommissionRate("10");
      setClientSettlementMethod("Bill With Job");
    }
  }, [clientName, clients]);

  useEffect(() => {
    const found = drivers.find((d) => normalizeText(d.driverName) === normalizeText(driverName));
    if (found) {
      setDriverMode(found.driverMode || "Normal");
      setSelectedVehicleType(found.vehicleType || "");
      setDriverCommissionRate(found.commissionRate || "15");
      setDriverSettlementMethod(found.driverSettlementMethod || "Deduct From Payout");
    } else {
      setDriverMode("Normal");
      setSelectedVehicleType("");
      setDriverCommissionRate("15");
      setDriverSettlementMethod("Deduct From Payout");
    }
  }, [driverName, drivers]);

  // ---------------------------------------------------------------------------
  // LIVE COMMISSION RESULT
  // commission = trip * rate%  (or weight * rate for heavy)
  // vat = commission * 15%
  // totalCharge = commission + vat
  // All movement amounts (billing, deposit, A/R, payout) use totalCharge.
  // ---------------------------------------------------------------------------
  const result = useMemo(() => {
    const trip = cleanNumber(tripValue);
    const wt = cleanNumber(weight);
    const rt = cleanNumber(rate);
    const clientRatePct = cleanNumber(clientCommissionRate) || 10;
    const driverRatePct = cleanNumber(driverCommissionRate) || 15;

    // Step 1: compute base commission amounts
    let clientCommAmt = 0;
    let driverCommAmt = 0;
    let clientNote = "";
    let driverNote = "";

    if (clientMode === "Normal") {
      clientCommAmt = trip * (clientRatePct / 100);
      clientNote = `Client normal: trip x ${clientRatePct}% commission + 15% VAT.`;
    } else if (clientMode === "Heavy") {
      clientCommAmt = wt * rt;
      clientNote = "Client heavy: weight x rate commission + 15% VAT.";
    } else if (clientMode === "No Commission") {
      clientCommAmt = 0;
      clientNote = "Client no commission.";
    } else if (clientMode === "Future Deduction") {
      clientCommAmt = trip * (clientRatePct / 100);
      clientNote = `Client future deduction: trip x ${clientRatePct}% + VAT posted to A/R.`;
    }

    if (driverMode === "Normal") {
      driverCommAmt = trip * (driverRatePct / 100);
      driverNote = `Driver normal: trip x ${driverRatePct}% commission + 15% VAT.`;
    } else if (driverMode === "Heavy") {
      driverCommAmt = wt * rt;
      driverNote = "Driver heavy: weight x rate commission + 15% VAT.";
    } else if (driverMode === "No Commission") {
      driverCommAmt = 0;
      driverNote = "Driver no commission.";
    } else if (driverMode === "Future Deduction") {
      driverCommAmt = trip * (driverRatePct / 100);
      driverNote = `Driver future deduction: trip x ${driverRatePct}% + VAT posted to A/R.`;
    }

    // Step 2: compute VAT on top of commission
    const clientCalc = calcVat(clientCommAmt);
    const driverCalc = calcVat(driverCommAmt);
    // clientCalc.commission = commission before VAT
    // clientCalc.vat        = commission * 0.15
    // clientCalc.totalCharge = commission + vat

    const baseAmount = Math.max(clientCalc.totalCharge, driverCalc.totalCharge);

    // Step 3: look up current deposit balances for live preview
    const clientEntity = clients.find((c) => normalizeText(c.clientName) === normalizeText(clientName));
    const driverEntity = drivers.find((d) => normalizeText(d.driverName) === normalizeText(driverName));

    const currentClientDeposit = clientEntity
      ? clientDepositLedger
          .filter((r) => r.clientId === clientEntity.clientId && r.voided !== true)
          .reduce((s, r) => s + r.depositIn - r.depositOut, 0)
      : 0;
    const currentDriverDeposit = driverEntity
      ? driverDepositLedger
          .filter((r) => r.driverId === driverEntity.driverId && r.voided !== true)
          .reduce((s, r) => s + r.depositIn - r.depositOut, 0)
      : 0;

    // Step 4: movement math — all use totalCharge (commission + VAT)
    let clientBillingTotal = trip;
    let clientDepositUsed = 0;
    let clientArAdded = 0;

    if (clientSettlementMethod === "Bill With Job") {
      clientBillingTotal = trip + clientCalc.totalCharge;
    } else if (clientSettlementMethod === "Deduct From Deposit") {
      clientDepositUsed = Math.min(currentClientDeposit, clientCalc.totalCharge);
      clientArAdded = clientCalc.totalCharge - clientDepositUsed;
      clientBillingTotal = trip;
    } else if (clientSettlementMethod === "Move To A/R") {
      clientArAdded = clientCalc.totalCharge;
      clientBillingTotal = trip;
    }

    let driverPayment = trip;
    let driverDepositUsed = 0;
    let driverArAdded = 0;

    if (driverSettlementMethod === "Deduct From Payout") {
      driverPayment = trip - driverCalc.totalCharge;
    } else if (driverSettlementMethod === "Deduct From Deposit") {
      driverDepositUsed = Math.min(currentDriverDeposit, driverCalc.totalCharge);
      driverArAdded = driverCalc.totalCharge - driverDepositUsed;
      driverPayment = trip;
    } else if (driverSettlementMethod === "Future Deduction") {
      driverArAdded = driverCalc.totalCharge;
      driverPayment = trip;
    }

    return {
      baseAmount:          baseAmount.toFixed(2),
      clientCommission:    clientCalc.commission.toFixed(2),
      clientVat:           clientCalc.vat.toFixed(2),
      clientTotalCharge:   clientCalc.totalCharge.toFixed(2),
      clientBillingTotal:  clientBillingTotal.toFixed(2),
      clientDepositUsed:   clientDepositUsed.toFixed(2),
      clientArAdded:       clientArAdded.toFixed(2),
      driverCommission:    driverCalc.commission.toFixed(2),
      driverVat:           driverCalc.vat.toFixed(2),
      driverTotalCharge:   driverCalc.totalCharge.toFixed(2),
      driverPayment:       driverPayment.toFixed(2),
      driverDepositUsed:   driverDepositUsed.toFixed(2),
      driverArAdded:       driverArAdded.toFixed(2),
      clientNote,
      driverNote,
    };
  }, [
    tripValue, weight, rate,
    clientMode, driverMode,
    clientCommissionRate, driverCommissionRate,
    clientSettlementMethod, driverSettlementMethod,
    clientName, driverName,
    clients, drivers,
    clientDepositLedger, driverDepositLedger,
  ]);

  const filteredClients = clients.filter((c) =>
    normalizeText(c.clientName).includes(normalizeText(clientSearch))
  );
  const filteredDrivers = drivers.filter((d) => {
    const nameMatch = normalizeText(d.driverName).includes(normalizeText(driverSearch));
    const vehicleMatch = vehicleFilter === "All" || d.vehicleType === vehicleFilter;
    return nameMatch && vehicleMatch;
  });

  function getClientDepositBalance(clientId) {
    return clientDepositLedger
      .filter((r) => r.clientId === clientId && r.voided !== true)
      .reduce((s, r) => s + r.depositIn - r.depositOut, 0);
  }
  function getDriverDepositBalance(driverId) {
    return driverDepositLedger
      .filter((r) => r.driverId === driverId && r.voided !== true)
      .reduce((s, r) => s + r.depositIn - r.depositOut, 0);
  }
  function getClientArBalance(clientId) {
    return clientArLedger
      .filter((r) => r.clientId === clientId && r.voided !== true)
      .reduce((s, r) => s + r.arIncrease - r.arRecovery, 0);
  }
  function getDriverArBalance(driverId) {
    return driverArLedger
      .filter((r) => r.driverId === driverId && r.voided !== true)
      .reduce((s, r) => s + r.arIncrease - r.arRecovery, 0);
  }

  function handleClientSave() {
    setClientError(""); setClientInfo("");
    const normName = normalizeText(clientForm.clientName);
    if (!normName) { setClientError("Client name is required."); return; }
    const existing = clients.find((c) => normalizeText(c.clientName) === normName);
    if (existing) {
      setClientInfo(`Client already exists. Existing ID reused: ${existing.clientId}`);
      setClientForm({
        clientId: existing.clientId,
        clientName: existing.clientName,
        phone: existing.phone || "",
        commissionRate: existing.commissionRate || "10",
        clientMode: existing.clientMode || "Normal",
        clientSettlementMethod: existing.clientSettlementMethod || "Bill With Job",
        openingDepositBalance: String(existing.openingDepositBalance || 0),
      });
      return;
    }
    const openingDeposit = cleanNumber(clientForm.openingDepositBalance);
    const newClient = { ...clientForm, openingDepositBalance: openingDeposit.toFixed(2) };
    setClients((prev) => [...prev, newClient]);
    if (openingDeposit > 0) {
      setClientDepositLedger((prev) => [
        ...prev,
        {
          jobNo: "OPENING", jobDate: "",
          clientId: newClient.clientId, clientName: newClient.clientName,
          description: "Opening Deposit Balance",
          depositIn: openingDeposit, depositOut: 0,
          runningBalance: getClientDepositBalance(newClient.clientId) + openingDeposit,
        },
      ]);
    }
    const next = clientCounter + 1;
    setClientCounter(next);
    setClientForm({
      clientId: formatId("CLT", next), clientName: "", phone: "",
      commissionRate: "10", clientMode: "Normal",
      clientSettlementMethod: "Bill With Job", openingDepositBalance: "0",
    });
    setClientInfo(`Client saved with ID ${newClient.clientId}.`);
  }

  function handleDriverSave() {
    setDriverError(""); setDriverInfo("");
    const normName = normalizeText(driverForm.driverName);
    const normPlate = normalizeText(driverForm.plateNo);
    if (!normName) { setDriverError("Driver name is required."); return; }
    if (!driverForm.vehicleType) { setDriverError("Vehicle type is required."); return; }
    const existing = drivers.find((d) => normalizeText(d.driverName) === normName);
    if (existing) {
      setDriverInfo(`Driver already exists. Existing ID reused: ${existing.driverId}`);
      setDriverForm({
        driverId: existing.driverId, driverName: existing.driverName,
        phone: existing.phone || "", vehicleType: existing.vehicleType || "",
        plateNo: existing.plateNo || "", commissionRate: existing.commissionRate || "15",
        driverMode: existing.driverMode || "Normal",
        driverSettlementMethod: existing.driverSettlementMethod || "Deduct From Payout",
        openingDepositBalance: String(existing.openingDepositBalance || 0),
      });
      return;
    }
    if (normPlate && drivers.find((d) => normalizeText(d.plateNo) === normPlate)) {
      setDriverError("Plate number already exists."); return;
    }
    const openingDeposit = cleanNumber(driverForm.openingDepositBalance);
    const newDriver = { ...driverForm, openingDepositBalance: openingDeposit.toFixed(2) };
    setDrivers((prev) => [...prev, newDriver]);
    if (openingDeposit > 0) {
      setDriverDepositLedger((prev) => [
        ...prev,
        {
          jobNo: "OPENING", jobDate: "",
          driverId: newDriver.driverId, driverName: newDriver.driverName,
          description: "Opening Deposit Balance",
          depositIn: openingDeposit, depositOut: 0,
          runningBalance: getDriverDepositBalance(newDriver.driverId) + openingDeposit,
        },
      ]);
    }
    const next = driverCounter + 1;
    setDriverCounter(next);
    setDriverForm({
      driverId: formatId("DRV", next), driverName: "", phone: "",
      vehicleType: "", plateNo: "", commissionRate: "15",
      driverMode: "Normal", driverSettlementMethod: "Deduct From Payout", openingDepositBalance: "0",
    });
    setDriverInfo(`Driver saved with ID ${newDriver.driverId}.`);
  }

  function handleClientDepositSave() {
    setClientDepositError(""); setClientDepositInfo("");
    if (!clientDepositForm.depositDate) { setClientDepositError("Deposit date is required."); return; }
    if (!clientDepositForm.clientName) { setClientDepositError("Client is required."); return; }
    if (!(cleanNumber(clientDepositForm.amount) > 0)) { setClientDepositError("Deposit amount must be greater than zero."); return; }
    const sel = clients.find((c) => normalizeText(c.clientName) === normalizeText(clientDepositForm.clientName));
    if (!sel) { setClientDepositError("Selected client record was not found."); return; }
    const amount = cleanNumber(clientDepositForm.amount);
    const after = getClientDepositBalance(sel.clientId) + amount;
    setClientDepositLedger((prev) => [
      ...prev,
      {
        jobNo: clientDepositForm.reference || "MANUAL-DEPOSIT",
        jobDate: clientDepositForm.depositDate,
        clientId: sel.clientId, clientName: sel.clientName,
        description: clientDepositForm.note || "Manual Deposit Top-Up",
        depositIn: amount, depositOut: 0, runningBalance: after,
      },
    ]);
    setClientDepositForm({ depositDate: "", clientName: "", amount: "", reference: "", note: "" });
    setClientDepositInfo("Client deposit posted successfully.");
  }

  function handleDriverDepositSave() {
    setDriverDepositError(""); setDriverDepositInfo("");
    if (!driverDepositForm.depositDate) { setDriverDepositError("Deposit date is required."); return; }
    if (!driverDepositForm.driverName) { setDriverDepositError("Driver is required."); return; }
    if (!(cleanNumber(driverDepositForm.amount) > 0)) { setDriverDepositError("Deposit amount must be greater than zero."); return; }
    const sel = drivers.find((d) => normalizeText(d.driverName) === normalizeText(driverDepositForm.driverName));
    if (!sel) { setDriverDepositError("Selected driver record was not found."); return; }
    const amount = cleanNumber(driverDepositForm.amount);
    const after = getDriverDepositBalance(sel.driverId) + amount;
    setDriverDepositLedger((prev) => [
      ...prev,
      {
        jobNo: driverDepositForm.reference || "MANUAL-DEPOSIT",
        jobDate: driverDepositForm.depositDate,
        driverId: sel.driverId, driverName: sel.driverName,
        description: driverDepositForm.note || "Manual Deposit Top-Up",
        depositIn: amount, depositOut: 0, runningBalance: after,
      },
    ]);
    setDriverDepositForm({ depositDate: "", driverName: "", amount: "", reference: "", note: "" });
    setDriverDepositInfo("Driver deposit posted successfully.");
  }

  function handleClientSettlementSave() {
    setClientSettlementError(""); setClientSettlementInfo("");
    if (!clientSettlementForm.settlementDate) { setClientSettlementError("Settlement date is required."); return; }
    if (!clientSettlementForm.clientName) { setClientSettlementError("Client is required."); return; }
    if (!(cleanNumber(clientSettlementForm.amount) > 0)) { setClientSettlementError("Settlement amount must be greater than zero."); return; }
    const sel = clients.find((c) => normalizeText(c.clientName) === normalizeText(clientSettlementForm.clientName));
    if (!sel) { setClientSettlementError("Selected client record was not found."); return; }
    const balance = getClientArBalance(sel.clientId);
    if (balance <= 0) { setClientSettlementError("This client has no outstanding A/R."); return; }
    const requested = cleanNumber(clientSettlementForm.amount);
    const recovery = Math.min(balance, requested);
    const after = balance - recovery;
    setClientArLedger((prev) => [
      ...prev,
      {
        jobNo: clientSettlementForm.reference || "MANUAL-SETTLEMENT",
        jobDate: clientSettlementForm.settlementDate,
        clientId: sel.clientId, clientName: sel.clientName,
        description: `Manual A/R Settlement - ${clientSettlementForm.paymentMethod}` +
          (clientSettlementForm.note ? ` - ${clientSettlementForm.note}` : ""),
        arIncrease: 0, arRecovery: recovery, runningBalance: after,
      },
    ]);
    setClientSettlementForm({ settlementDate: "", clientName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });
    setClientSettlementInfo(
      requested > recovery
        ? `Client A/R settled up to outstanding balance only: ${recovery.toFixed(2)}`
        : "Client A/R settlement posted successfully."
    );
  }

  function handleDriverSettlementSave() {
    setDriverSettlementError(""); setDriverSettlementInfo("");
    if (!driverSettlementForm.settlementDate) { setDriverSettlementError("Settlement date is required."); return; }
    if (!driverSettlementForm.driverName) { setDriverSettlementError("Driver is required."); return; }
    if (!(cleanNumber(driverSettlementForm.amount) > 0)) { setDriverSettlementError("Settlement amount must be greater than zero."); return; }
    const sel = drivers.find((d) => normalizeText(d.driverName) === normalizeText(driverSettlementForm.driverName));
    if (!sel) { setDriverSettlementError("Selected driver record was not found."); return; }
    const balance = getDriverArBalance(sel.driverId);
    if (balance <= 0) { setDriverSettlementError("This driver has no outstanding A/R."); return; }
    const requested = cleanNumber(driverSettlementForm.amount);
    const recovery = Math.min(balance, requested);
    const after = balance - recovery;
    setDriverArLedger((prev) => [
      ...prev,
      {
        jobNo: driverSettlementForm.reference || "MANUAL-SETTLEMENT",
        jobDate: driverSettlementForm.settlementDate,
        driverId: sel.driverId, driverName: sel.driverName,
        description: `Manual A/R Settlement - ${driverSettlementForm.paymentMethod}` +
          (driverSettlementForm.note ? ` - ${driverSettlementForm.note}` : ""),
        arIncrease: 0, arRecovery: recovery, runningBalance: after,
      },
    ]);
    setDriverSettlementForm({ settlementDate: "", driverName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });
    setDriverSettlementInfo(
      requested > recovery
        ? `Driver A/R settled up to outstanding balance only: ${recovery.toFixed(2)}`
        : "Driver A/R settlement posted successfully."
    );
  }

  // ---------------------------------------------------------------------------
  // SAVE JOB
  // All posting uses totalCharge = commission + VAT (15% on top of commission).
  // ---------------------------------------------------------------------------
  function handleSaveJob() {
    setJobError("");
    const isEditing = editingJobNo !== null;
    const effectiveJobNo = isEditing ? editingJobNo : jobNo;
    if (!clientName) { setJobError("Client is required."); return; }
    if (!driverName) { setJobError("Driver is required."); return; }
    if (!jobDate) { setJobError("Job Date is required."); return; }
    if (clientMode === "Heavy" || driverMode === "Heavy") {
      if (!(cleanNumber(weight) > 0) || !(cleanNumber(rate) > 0)) {
        setJobError("Weight and Rate are required for heavy mode."); return;
      }
    } else {
      if (!(cleanNumber(tripValue) > 0)) {
        setJobError("Trip Value is required for normal/non-heavy jobs."); return;
      }
    }
    if (!isEditing && jobs.find((j) => j.jobNo === jobNo)) {
      setJobError("Duplicate Job No detected."); return;
    }

    const selClient = clients.find((c) => normalizeText(c.clientName) === normalizeText(clientName));
    const selDriver = drivers.find((d) => normalizeText(d.driverName) === normalizeText(driverName));
    if (!selClient) { setJobError("Selected client record was not found."); return; }
    if (!selDriver) { setJobError("Selected driver record was not found."); return; }

    // totalCharge = commission + VAT — the amount used for all postings
    const clientTotalCharge = cleanNumber(result.clientTotalCharge);
    const driverTotalCharge = cleanNumber(result.driverTotalCharge);

    const clientDepositBefore = getClientDepositBalance(selClient.clientId);
    const driverDepositBefore = getDriverDepositBalance(selDriver.driverId);
    const clientArBefore = getClientArBalance(selClient.clientId);
    const driverArBefore = getDriverArBalance(selDriver.driverId);

    // Auto A/R recovery from deposit (only for billable modes)
    let clientRecovery = 0;
    let driverRecovery = 0;
    if (clientMode !== "No Commission" && clientMode !== "Future Deduction" && clientArBefore > 0 && clientDepositBefore > 0) {
      clientRecovery = Math.min(clientArBefore, clientDepositBefore);
    }
    if (driverMode !== "No Commission" && driverMode !== "Future Deduction" && driverArBefore > 0 && driverDepositBefore > 0) {
      driverRecovery = Math.min(driverArBefore, driverDepositBefore);
    }

    const clientDepAfterRecovery = clientDepositBefore - clientRecovery;
    const driverDepAfterRecovery = driverDepositBefore - driverRecovery;
    const clientArAfterRecovery = clientArBefore - clientRecovery;
    const driverArAfterRecovery = driverArBefore - driverRecovery;

    // Client posting — uses totalCharge (commission + VAT)
    let clientDepOut = 0;
    let clientArInc = 0;
    let clientPostNote = "";
    if (clientMode === "No Commission") {
      clientPostNote = "No client deduction.";
    } else if (clientSettlementMethod === "Move To A/R") {
      clientArInc = clientTotalCharge;
      clientPostNote = "Client commission + VAT moved to A/R.";
    } else if (clientSettlementMethod === "Deduct From Deposit") {
      clientDepOut = Math.min(clientDepAfterRecovery, clientTotalCharge);
      clientArInc = Math.max(0, clientTotalCharge - clientDepOut);
      clientPostNote = clientArInc > 0
        ? "Client deposit used first, shortage moved to A/R."
        : "Client commission + VAT deducted from deposit.";
    } else {
      clientPostNote = "Client billed with job.";
    }

    // Driver posting — uses totalCharge (commission + VAT)
    let driverDepOut = 0;
    let driverArInc = 0;
    let driverPostNote = "";
    if (driverMode === "No Commission") {
      driverPostNote = "No driver deduction.";
    } else if (driverSettlementMethod === "Future Deduction") {
      driverArInc = driverTotalCharge;
      driverPostNote = "Driver commission + VAT moved to A/R.";
    } else if (driverSettlementMethod === "Deduct From Deposit") {
      driverDepOut = Math.min(driverDepAfterRecovery, driverTotalCharge);
      driverArInc = Math.max(0, driverTotalCharge - driverDepOut);
      driverPostNote = driverArInc > 0
        ? "Driver deposit used first, shortage moved to A/R."
        : "Driver commission + VAT deducted from deposit.";
    } else {
      // Deduct From Payout
      driverPostNote = "Driver commission + VAT deducted from payout.";
    }

    const clientDepAfter = clientDepAfterRecovery - clientDepOut;
    const driverDepAfter = driverDepAfterRecovery - driverDepOut;
    const clientArAfter = clientArAfterRecovery + clientArInc;
    const driverArAfter = driverArAfterRecovery + driverArInc;

    const newJob = {
      jobNo: effectiveJobNo, jobDate, clientName, driverName,
      pickupLocation, dropoffLocation, pickupTime, dropoffTime,
      estimatedDistance: cleanNumber(estimatedDistance).toFixed(2),
      actualDistance: cleanNumber(actualDistance).toFixed(2),
      goodsType, selectedVehicleType,
      tripValue: cleanNumber(tripValue).toFixed(2),
      weight: cleanNumber(weight).toFixed(2),
      rate: cleanNumber(rate).toFixed(2),
      clientMode, driverMode, clientCommissionRate, driverCommissionRate,
      clientSettlementMethod, driverSettlementMethod,
      baseAmount: result.baseAmount,
      clientCommission: result.clientCommission,
      clientVat: result.clientVat,
      clientTotalCharge: result.clientTotalCharge,
      driverCommission: result.driverCommission,
      driverVat: result.driverVat,
      driverTotalCharge: result.driverTotalCharge,
      clientDepositBefore: clientDepositBefore.toFixed(2),
      clientArBefore: clientArBefore.toFixed(2),
      clientArRecovered: clientRecovery.toFixed(2),
      clientDepositDeducted: clientDepOut.toFixed(2),
      clientDeducted: clientDepOut.toFixed(2),
      remainingClientAr: clientArInc.toFixed(2),
      clientDepositAfter: clientDepAfter.toFixed(2),
      clientArCreated: clientArInc.toFixed(2),
      clientArAfter: clientArAfter.toFixed(2),
      driverDepositBefore: driverDepositBefore.toFixed(2),
      driverArBefore: driverArBefore.toFixed(2),
      driverArRecovered: driverRecovery.toFixed(2),
      driverDepositDeducted: driverDepOut.toFixed(2),
      driverDeducted: driverDepOut.toFixed(2),
      remainingDriverAr: driverArInc.toFixed(2),
      driverDepositAfter: driverDepAfter.toFixed(2),
      driverArCreated: driverArInc.toFixed(2),
      driverArAfter: driverArAfter.toFixed(2),
      clientPostingNote: clientPostNote,
      driverPostingNote: driverPostNote,
    };

    if (isEditing) {
      setJobs((prev) => prev.map((j) => j.jobNo === editingJobNo ? newJob : j));
    } else {
      setJobs((prev) => [...prev, newJob]);
    }

    if (clientRecovery > 0) {
      setClientDepositLedger((prev) => [...prev, {
        jobNo, jobDate, clientId: selClient.clientId, clientName: selClient.clientName,
        description: "A/R Recovery From Deposit",
        depositIn: 0, depositOut: clientRecovery, runningBalance: clientDepAfterRecovery,
      }]);
      setClientArLedger((prev) => [...prev, {
        jobNo, jobDate, clientId: selClient.clientId, clientName: selClient.clientName,
        description: "A/R Recovery",
        arIncrease: 0, arRecovery: clientRecovery, runningBalance: clientArAfterRecovery,
      }]);
    }
    if (driverRecovery > 0) {
      setDriverDepositLedger((prev) => [...prev, {
        jobNo, jobDate, driverId: selDriver.driverId, driverName: selDriver.driverName,
        description: "A/R Recovery From Deposit",
        depositIn: 0, depositOut: driverRecovery, runningBalance: driverDepAfterRecovery,
      }]);
      setDriverArLedger((prev) => [...prev, {
        jobNo, jobDate, driverId: selDriver.driverId, driverName: selDriver.driverName,
        description: "A/R Recovery",
        arIncrease: 0, arRecovery: driverRecovery, runningBalance: driverArAfterRecovery,
      }]);
    }
    if (clientDepOut > 0) {
      setClientDepositLedger((prev) => [...prev, {
        jobNo, jobDate, clientId: selClient.clientId, clientName: selClient.clientName,
        description: "Commission + VAT Deducted From Deposit",
        depositIn: 0, depositOut: clientDepOut, runningBalance: clientDepAfter,
      }]);
    }
    if (driverDepOut > 0) {
      setDriverDepositLedger((prev) => [...prev, {
        jobNo, jobDate, driverId: selDriver.driverId, driverName: selDriver.driverName,
        description: "Commission + VAT Deducted From Deposit",
        depositIn: 0, depositOut: driverDepOut, runningBalance: driverDepAfter,
      }]);
    }
    if (clientArInc > 0) {
      setClientArLedger((prev) => [...prev, {
        jobNo, jobDate, clientId: selClient.clientId, clientName: selClient.clientName,
        description: clientMode === "Future Deduction"
          ? "Future Deduction A/R"
          : clientSettlementMethod === "Move To A/R"
          ? "Commission + VAT Moved To A/R"
          : "Deposit Shortage A/R",
        arIncrease: clientArInc, arRecovery: 0, runningBalance: clientArAfter,
      }]);
    }
    if (driverArInc > 0) {
      setDriverArLedger((prev) => [...prev, {
        jobNo, jobDate, driverId: selDriver.driverId, driverName: selDriver.driverName,
        description: driverMode === "Future Deduction"
          ? "Future Deduction A/R"
          : driverSettlementMethod === "Future Deduction"
          ? "Commission + VAT Moved To A/R"
          : "Deposit Shortage A/R",
        arIncrease: driverArInc, arRecovery: 0, runningBalance: driverArAfter,
      }]);
    }

    if (!isEditing) { setJobCounter((prev) => prev + 1); }
    setJobDate(""); setClientName(""); setDriverName("");
    setTripValue(""); setWeight(""); setRate("");
    setClientMode("Normal"); setDriverMode("Normal");
    setSelectedVehicleType(""); setClientCommissionRate("10"); setDriverCommissionRate("15");
    setClientSettlementMethod("Bill With Job"); setDriverSettlementMethod("Deduct From Payout");
    setPickupLocation(""); setDropoffLocation(""); setPickupTime(""); setDropoffTime("");
    setEstimatedDistance(""); setActualDistance(""); setGoodsType("");
    setEditingJobNo(null);
  }

  // ---------------------------------------------------------------------------
  // EDIT JOB — start / cancel
  // ---------------------------------------------------------------------------
  function handleStartEditJob(job) {
    setEditingJobNo(job.jobNo);
    setJobDate(job.jobDate || "");
    setClientName(job.clientName || "");
    setDriverName(job.driverName || "");
    setTripValue(job.tripValue || "");
    setWeight(job.weight || "");
    setRate(job.rate || "");
    setClientMode(job.clientMode || "Normal");
    setDriverMode(job.driverMode || "Normal");
    setClientCommissionRate(job.clientCommissionRate || "10");
    setDriverCommissionRate(job.driverCommissionRate || "15");
    setClientSettlementMethod(job.clientSettlementMethod || "Bill With Job");
    setDriverSettlementMethod(job.driverSettlementMethod || "Deduct From Payout");
    setPickupLocation(job.pickupLocation || "");
    setDropoffLocation(job.dropoffLocation || "");
    setPickupTime(job.pickupTime || "");
    setDropoffTime(job.dropoffTime || "");
    setEstimatedDistance(job.estimatedDistance || "");
    setActualDistance(job.actualDistance || "");
    setGoodsType(job.goodsType || "");
    setSelectedVehicleType(job.selectedVehicleType || "");
    setJobError("");
  }

  function handleCancelEditJob() {
    setEditingJobNo(null);
    setJobDate(""); setClientName(""); setDriverName("");
    setTripValue(""); setWeight(""); setRate("");
    setClientMode("Normal"); setDriverMode("Normal");
    setSelectedVehicleType(""); setClientCommissionRate("10"); setDriverCommissionRate("15");
    setClientSettlementMethod("Bill With Job"); setDriverSettlementMethod("Deduct From Payout");
    setPickupLocation(""); setDropoffLocation(""); setPickupTime(""); setDropoffTime("");
    setEstimatedDistance(""); setActualDistance(""); setGoodsType("");
    setJobError("");
  }

  function clearAllSavedData() {
    if (!window.confirm("Are you sure you want to clear all saved ERP data?")) return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setClients([]); setDrivers([]); setJobs([]);
    setClientDepositLedger([]); setDriverDepositLedger([]);
    setClientArLedger([]); setDriverArLedger([]);
    setClientCounter(1); setDriverCounter(1); setJobCounter(1);
    setClientForm({ clientId: "CLT-001", clientName: "", phone: "", commissionRate: "10", clientMode: "Normal", clientSettlementMethod: "Bill With Job", openingDepositBalance: "0" });
    setDriverForm({ driverId: "DRV-001", driverName: "", phone: "", vehicleType: "", plateNo: "", commissionRate: "15", driverMode: "Normal", driverSettlementMethod: "Deduct From Payout", openingDepositBalance: "0" });
    setClientDepositForm({ depositDate: "", clientName: "", amount: "", reference: "", note: "" });
    setDriverDepositForm({ depositDate: "", driverName: "", amount: "", reference: "", note: "" });
    setClientSettlementForm({ settlementDate: "", clientName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });
    setDriverSettlementForm({ settlementDate: "", driverName: "", amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });
    setJobDate(""); setClientName(""); setDriverName("");
    setTripValue(""); setWeight(""); setRate("");
    setClientMode("Normal"); setDriverMode("Normal");
    setSelectedVehicleType(""); setClientCommissionRate("10"); setDriverCommissionRate("15");
    setClientSettlementMethod("Bill With Job"); setDriverSettlementMethod("Deduct From Payout");
    setPickupLocation(""); setDropoffLocation(""); setPickupTime(""); setDropoffTime("");
    setEstimatedDistance(""); setActualDistance(""); setGoodsType("");
    setClientSearch(""); setDriverSearch(""); setVehicleFilter("All");
    setClientError(""); setDriverError(""); setJobError("");
    setClientDepositError(""); setDriverDepositError("");
    setClientSettlementError(""); setDriverSettlementError("");
    setClientInfo(""); setDriverInfo("");
    setClientDepositInfo(""); setDriverDepositInfo("");
    setClientSettlementInfo(""); setDriverSettlementInfo("");
    setShowClientForm(false); setShowDriverForm(false);
    setShowClientDepositForm(false); setShowDriverDepositForm(false);
    setShowClientSettlementForm(false); setShowDriverSettlementForm(false);
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f5f7fb", minHeight: "100vh", padding: "20px" }}>
      <div style={{ backgroundColor: "#1e3a8a", color: "white", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Transport Brokerage ERP</h1>
        <p style={{ margin: "8px 0 0 0" }}>Phase 6 Manual A/R Settlement</p>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Backup / Clear Data</h2>
        <button style={dangerButtonStyle} onClick={clearAllSavedData}>Clear All Saved Data</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          <h2>Client Master</h2>
          <p>Add and manage clients</p>
          <button style={buttonStyle} onClick={() => setShowClientForm(!showClientForm)}>Add Client</button>
        </div>
        <div style={cardStyle}>
          <h2>Driver Master</h2>
          <p>Add and manage drivers</p>
          <button style={buttonStyle} onClick={() => setShowDriverForm(!showDriverForm)}>Add Driver</button>
        </div>
        <div style={cardStyle}>
          <h2>Manual Client Deposit</h2>
          <p>Post a new client deposit top-up</p>
          <button style={buttonStyle} onClick={() => setShowClientDepositForm(!showClientDepositForm)}>Add Client Deposit</button>
        </div>
        <div style={cardStyle}>
          <h2>Manual Driver Deposit</h2>
          <p>Post a new driver deposit top-up</p>
          <button style={buttonStyle} onClick={() => setShowDriverDepositForm(!showDriverDepositForm)}>Add Driver Deposit</button>
        </div>
        <div style={cardStyle}>
          <h2>Client A/R Settlement</h2>
          <p>Record client transfer or deposit against A/R</p>
          <button style={buttonStyle} onClick={() => setShowClientSettlementForm(!showClientSettlementForm)}>Settle Client A/R</button>
        </div>
        <div style={cardStyle}>
          <h2>Driver A/R Settlement</h2>
          <p>Record driver transfer or deposit against A/R</p>
          <button style={buttonStyle} onClick={() => setShowDriverSettlementForm(!showDriverSettlementForm)}>Settle Driver A/R</button>
        </div>
      </div>

      {showClientForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Client Entry</h2>
          <div style={gridStyle}>
            <div><label>Client ID</label><input style={inputStyle} value={clientForm.clientId} readOnly /></div>
            <div><label>Client Name</label><input style={inputStyle} value={clientForm.clientName} onChange={(e) => setClientForm({ ...clientForm, clientName: e.target.value })} placeholder="Enter client name" /></div>
            <div><label>Phone</label><input style={inputStyle} value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="Enter phone" /></div>
            <div><label>Commission Rate (%)</label><input style={inputStyle} value={clientForm.commissionRate} onChange={(e) => setClientForm({ ...clientForm, commissionRate: e.target.value })} /></div>
            <div>
              <label>Client Mode</label>
              <select style={inputStyle} value={clientForm.clientMode} onChange={(e) => setClientForm({ ...clientForm, clientMode: e.target.value })}>
                <option>Normal</option><option>Heavy</option><option>No Commission</option><option>Future Deduction</option>
              </select>
            </div>
            <div>
              <label>Client Settlement Method</label>
              <select style={inputStyle} value={clientForm.clientSettlementMethod} onChange={(e) => setClientForm({ ...clientForm, clientSettlementMethod: e.target.value })}>
                {clientSettlementMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label>Opening Deposit Balance</label><input style={inputStyle} value={clientForm.openingDepositBalance} onChange={(e) => setClientForm({ ...clientForm, openingDepositBalance: e.target.value })} placeholder="0" /></div>
          </div>
          {clientError && <p style={{ color: "red", marginTop: "12px" }}>{clientError}</p>}
          {clientInfo && <p style={{ color: "green", marginTop: "12px" }}>{clientInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleClientSave}>Save Client</button></div>
        </div>
      )}

      {showDriverForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Driver Entry</h2>
          <div style={gridStyle}>
            <div><label>Driver ID</label><input style={inputStyle} value={driverForm.driverId} readOnly /></div>
            <div><label>Driver Name</label><input style={inputStyle} value={driverForm.driverName} onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })} placeholder="Enter driver name" /></div>
            <div><label>Phone</label><input style={inputStyle} value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} placeholder="Enter phone" /></div>
            <div>
              <label>Vehicle Type</label>
              <select style={inputStyle} value={driverForm.vehicleType} onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value })}>
                <option value="">Select vehicle type</option>
                {vehicleTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label>Plate No</label><input style={inputStyle} value={driverForm.plateNo} onChange={(e) => setDriverForm({ ...driverForm, plateNo: e.target.value })} placeholder="Enter plate number" /></div>
            <div><label>Commission Rate (%)</label><input style={inputStyle} value={driverForm.commissionRate} onChange={(e) => setDriverForm({ ...driverForm, commissionRate: e.target.value })} /></div>
            <div>
              <label>Driver Mode</label>
              <select style={inputStyle} value={driverForm.driverMode} onChange={(e) => setDriverForm({ ...driverForm, driverMode: e.target.value })}>
                <option>Normal</option><option>Heavy</option><option>No Commission</option><option>Future Deduction</option>
              </select>
            </div>
            <div>
              <label>Driver Settlement Method</label>
              <select style={inputStyle} value={driverForm.driverSettlementMethod} onChange={(e) => setDriverForm({ ...driverForm, driverSettlementMethod: e.target.value })}>
                {driverSettlementMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label>Opening Deposit Balance</label><input style={inputStyle} value={driverForm.openingDepositBalance} onChange={(e) => setDriverForm({ ...driverForm, openingDepositBalance: e.target.value })} placeholder="0" /></div>
          </div>
          {driverError && <p style={{ color: "red", marginTop: "12px" }}>{driverError}</p>}
          {driverInfo && <p style={{ color: "green", marginTop: "12px" }}>{driverInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleDriverSave}>Save Driver</button></div>
        </div>
      )}

      {showClientDepositForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Manual Client Deposit Input</h2>
          <div style={gridStyle}>
            <div><label>Deposit Date</label><input style={inputStyle} type="date" value={clientDepositForm.depositDate} onChange={(e) => setClientDepositForm({ ...clientDepositForm, depositDate: e.target.value })} /></div>
            <div>
              <label>Client Name</label>
              <select style={inputStyle} value={clientDepositForm.clientName} onChange={(e) => setClientDepositForm({ ...clientDepositForm, clientName: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.clientId} value={c.clientName}>{c.clientName}</option>)}
              </select>
            </div>
            <div><label>Deposit Amount</label><input style={inputStyle} value={clientDepositForm.amount} onChange={(e) => setClientDepositForm({ ...clientDepositForm, amount: e.target.value })} placeholder="Enter amount" /></div>
            <div><label>Reference</label><input style={inputStyle} value={clientDepositForm.reference} onChange={(e) => setClientDepositForm({ ...clientDepositForm, reference: e.target.value })} placeholder="Receipt or note ref" /></div>
            <div><label>Note</label><input style={inputStyle} value={clientDepositForm.note} onChange={(e) => setClientDepositForm({ ...clientDepositForm, note: e.target.value })} placeholder="Optional note" /></div>
          </div>
          {clientDepositError && <p style={{ color: "red", marginTop: "12px" }}>{clientDepositError}</p>}
          {clientDepositInfo && <p style={{ color: "green", marginTop: "12px" }}>{clientDepositInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleClientDepositSave}>Post Client Deposit</button></div>
        </div>
      )}

      {showDriverDepositForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Manual Driver Deposit Input</h2>
          <div style={gridStyle}>
            <div><label>Deposit Date</label><input style={inputStyle} type="date" value={driverDepositForm.depositDate} onChange={(e) => setDriverDepositForm({ ...driverDepositForm, depositDate: e.target.value })} /></div>
            <div>
              <label>Driver Name</label>
              <select style={inputStyle} value={driverDepositForm.driverName} onChange={(e) => setDriverDepositForm({ ...driverDepositForm, driverName: e.target.value })}>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d.driverId} value={d.driverName}>{d.driverName}</option>)}
              </select>
            </div>
            <div><label>Deposit Amount</label><input style={inputStyle} value={driverDepositForm.amount} onChange={(e) => setDriverDepositForm({ ...driverDepositForm, amount: e.target.value })} placeholder="Enter amount" /></div>
            <div><label>Reference</label><input style={inputStyle} value={driverDepositForm.reference} onChange={(e) => setDriverDepositForm({ ...driverDepositForm, reference: e.target.value })} placeholder="Receipt or note ref" /></div>
            <div><label>Note</label><input style={inputStyle} value={driverDepositForm.note} onChange={(e) => setDriverDepositForm({ ...driverDepositForm, note: e.target.value })} placeholder="Optional note" /></div>
          </div>
          {driverDepositError && <p style={{ color: "red", marginTop: "12px" }}>{driverDepositError}</p>}
          {driverDepositInfo && <p style={{ color: "green", marginTop: "12px" }}>{driverDepositInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleDriverDepositSave}>Post Driver Deposit</button></div>
        </div>
      )}

      {showClientSettlementForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Client A/R Settlement</h2>
          <div style={gridStyle}>
            <div><label>Settlement Date</label><input style={inputStyle} type="date" value={clientSettlementForm.settlementDate} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, settlementDate: e.target.value })} /></div>
            <div>
              <label>Client Name</label>
              <select style={inputStyle} value={clientSettlementForm.clientName} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, clientName: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.clientId} value={c.clientName}>{c.clientName}</option>)}
              </select>
            </div>
            <div><label>Settlement Amount</label><input style={inputStyle} value={clientSettlementForm.amount} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, amount: e.target.value })} placeholder="Enter amount" /></div>
            <div>
              <label>Payment Method</label>
              <select style={inputStyle} value={clientSettlementForm.paymentMethod} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, paymentMethod: e.target.value })}>
                {paymentMethods.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label>Reference</label><input style={inputStyle} value={clientSettlementForm.reference} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, reference: e.target.value })} placeholder="Bank ref / deposit ref" /></div>
            <div><label>Note</label><input style={inputStyle} value={clientSettlementForm.note} onChange={(e) => setClientSettlementForm({ ...clientSettlementForm, note: e.target.value })} placeholder="Optional note" /></div>
          </div>
          {clientSettlementError && <p style={{ color: "red", marginTop: "12px" }}>{clientSettlementError}</p>}
          {clientSettlementInfo && <p style={{ color: "green", marginTop: "12px" }}>{clientSettlementInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleClientSettlementSave}>Post Client Settlement</button></div>
        </div>
      )}

      {showDriverSettlementForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>Driver A/R Settlement</h2>
          <div style={gridStyle}>
            <div><label>Settlement Date</label><input style={inputStyle} type="date" value={driverSettlementForm.settlementDate} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, settlementDate: e.target.value })} /></div>
            <div>
              <label>Driver Name</label>
              <select style={inputStyle} value={driverSettlementForm.driverName} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, driverName: e.target.value })}>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d.driverId} value={d.driverName}>{d.driverName}</option>)}
              </select>
            </div>
            <div><label>Settlement Amount</label><input style={inputStyle} value={driverSettlementForm.amount} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, amount: e.target.value })} placeholder="Enter amount" /></div>
            <div>
              <label>Payment Method</label>
              <select style={inputStyle} value={driverSettlementForm.paymentMethod} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, paymentMethod: e.target.value })}>
                {paymentMethods.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label>Reference</label><input style={inputStyle} value={driverSettlementForm.reference} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, reference: e.target.value })} placeholder="Bank ref / deposit ref" /></div>
            <div><label>Note</label><input style={inputStyle} value={driverSettlementForm.note} onChange={(e) => setDriverSettlementForm({ ...driverSettlementForm, note: e.target.value })} placeholder="Optional note" /></div>
          </div>
          {driverSettlementError && <p style={{ color: "red", marginTop: "12px" }}>{driverSettlementError}</p>}
          {driverSettlementInfo && <p style={{ color: "green", marginTop: "12px" }}>{driverSettlementInfo}</p>}
          <div style={{ marginTop: "20px" }}><button style={buttonStyle} onClick={handleDriverSettlementSave}>Post Driver Settlement</button></div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>{editingJobNo ? `Editing Job: ${editingJobNo}` : "New Job Entry"}</h2>
        {editingJobNo && (
          <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px", color: "#856404" }}>
            <strong>Edit mode</strong> — you are editing {editingJobNo}. Ledger entries for this job will be replaced on save.
          </div>
        )}
        <div style={gridStyle}>
          <div><label>Job No</label><input style={inputStyle} value={jobNo} readOnly /></div>
          <div><label>Job Date</label><input style={inputStyle} type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} /></div>
          <div>
            <label>Client Name</label>
            <select style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.clientId} value={c.clientName}>{c.clientName}</option>)}
            </select>
          </div>
          <div>
            <label>Driver Name</label>
            <select style={inputStyle} value={driverName} onChange={(e) => setDriverName(e.target.value)}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.driverId} value={d.driverName}>{d.driverName}</option>)}
            </select>
          </div>
          <div><label>Pickup Location</label><input style={inputStyle} value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Enter pickup location" /></div>
          <div><label>Drop-off Location</label><input style={inputStyle} value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="Enter drop-off location" /></div>
          <div><label>Pickup Time</label><input style={inputStyle} type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} /></div>
          <div><label>Drop-off Time</label><input style={inputStyle} type="time" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} /></div>
          <div><label>Estimated Distance</label><input style={inputStyle} value={estimatedDistance} onChange={(e) => setEstimatedDistance(e.target.value)} placeholder="Estimated km" /></div>
          <div><label>Actual Distance</label><input style={inputStyle} value={actualDistance} onChange={(e) => setActualDistance(e.target.value)} placeholder="Actual km" /></div>
          <div><label>Type of Goods</label><input style={inputStyle} value={goodsType} onChange={(e) => setGoodsType(e.target.value)} placeholder="Enter type of goods" /></div>
          <div><label>Trip Value</label><input style={inputStyle} placeholder="Enter trip value" value={tripValue} onChange={(e) => setTripValue(e.target.value)} /></div>
          <div><label>Weight</label><input style={inputStyle} placeholder="For heavy jobs" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div><label>Rate</label><input style={inputStyle} placeholder="Rate per unit" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div>
            <label>Client Mode</label>
            <select style={inputStyle} value={clientMode} onChange={(e) => setClientMode(e.target.value)}>
              <option>Normal</option><option>Heavy</option><option>No Commission</option><option>Future Deduction</option>
            </select>
          </div>
          <div>
            <label>Driver Mode</label>
            <select style={inputStyle} value={driverMode} onChange={(e) => setDriverMode(e.target.value)}>
              <option>Normal</option><option>Heavy</option><option>No Commission</option><option>Future Deduction</option>
            </select>
          </div>
          <div>
            <label>Client Settlement Method</label>
            <select style={inputStyle} value={clientSettlementMethod} onChange={(e) => setClientSettlementMethod(e.target.value)}>
              {clientSettlementMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label>Driver Settlement Method</label>
            <select style={inputStyle} value={driverSettlementMethod} onChange={(e) => setDriverSettlementMethod(e.target.value)}>
              {driverSettlementMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label>Selected Vehicle Type</label><input style={inputStyle} value={selectedVehicleType} readOnly /></div>
          <div><label>Client Commission Rate (%)</label><input style={inputStyle} value={clientCommissionRate} readOnly /></div>
          <div><label>Driver Commission Rate (%)</label><input style={inputStyle} value={driverCommissionRate} readOnly /></div>
        </div>
        {jobError && <p style={{ color: "red", marginTop: "12px" }}>{jobError}</p>}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button
            style={editingJobNo ? { ...buttonStyle, background: "#e67e22" } : buttonStyle}
            onClick={handleSaveJob}
          >
            {editingJobNo ? "Update Job" : "Save Job"}
          </button>
          {editingJobNo && (
            <button style={{ ...buttonStyle, background: "#888" }} onClick={handleCancelEditJob}>
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Live Commission Result</h2>
        <p><strong>Base Amount:</strong> {result.baseAmount}</p>
        <p><strong>Client Commission:</strong> {result.clientCommission}</p>
        <p><strong>Client VAT (15%):</strong> {result.clientVat}</p>
        <p><strong>Client Total Charge:</strong> {result.clientTotalCharge}</p>
        <p><strong>Client Billing Total:</strong> {result.clientBillingTotal}</p>
        <p><strong>Client Deposit Used:</strong> {result.clientDepositUsed}</p>
        <p><strong>Client A/R Added:</strong> {result.clientArAdded}</p>
        <p><strong>Driver Commission:</strong> {result.driverCommission}</p>
        <p><strong>Driver VAT (15%):</strong> {result.driverVat}</p>
        <p><strong>Driver Total Charge:</strong> {result.driverTotalCharge}</p>
        <p><strong>Driver Payment:</strong> {result.driverPayment}</p>
        <p><strong>Driver Deposit Used:</strong> {result.driverDepositUsed}</p>
        <p><strong>Driver A/R Added:</strong> {result.driverArAdded}</p>
        <p><strong>Client Logic Note:</strong> {result.clientNote}</p>
        <p><strong>Driver Logic Note:</strong> {result.driverNote}</p>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Control Summary</h2>
        <p><strong>Total Jobs:</strong> {jobs.length}</p>
        <p><strong>Total Client Deposit Out:</strong> {clientDepositLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.depositOut || 0), 0).toFixed(2)}</p>
        <p><strong>Total Driver Deposit Out:</strong> {driverDepositLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.depositOut || 0), 0).toFixed(2)}</p>
        <p><strong>Total Client A/R Increase:</strong> {clientArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arIncrease || 0), 0).toFixed(2)}</p>
        <p><strong>Total Driver A/R Increase:</strong> {driverArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arIncrease || 0), 0).toFixed(2)}</p>
        <p><strong>Total Client A/R Recovery:</strong> {clientArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arRecovery || 0), 0).toFixed(2)}</p>
        <p><strong>Total Driver A/R Recovery:</strong> {driverArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arRecovery || 0), 0).toFixed(2)}</p>
        <p>
          <strong>Client Deposit Check:</strong>{" "}
          {jobs.filter((j) => j.voided !== true).reduce((s, r) => s + Number(r.clientDeducted || 0), 0).toFixed(2) ===
            clientDepositLedger
              .filter((r) => r.description === "Commission + VAT Deducted From Deposit" && r.voided !== true)
              .reduce((s, r) => s + Number(r.depositOut || 0), 0)
              .toFixed(2)
            ? "OK" : "Mismatch"}
        </p>
        <p>
          <strong>Client A/R Check:</strong>{" "}
          {jobs.filter((j) => j.voided !== true).reduce((s, r) => s + Number(r.remainingClientAr || 0), 0).toFixed(2) ===
            (
              clientArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arIncrease || 0), 0) -
              clientArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arRecovery || 0), 0)
            ).toFixed(2)
            ? "OK" : "Mismatch"}
        </p>
        <p>
          <strong>Driver A/R Check:</strong>{" "}
          {jobs.filter((j) => j.voided !== true).reduce((s, r) => s + Number(r.remainingDriverAr || 0), 0).toFixed(2) ===
            (
              driverArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arIncrease || 0), 0) -
              driverArLedger.filter((r) => r.voided !== true).reduce((s, r) => s + Number(r.arRecovery || 0), 0)
            ).toFixed(2)
            ? "OK" : "Mismatch"}
        </p>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Jobs List</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job No</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Driver</th>
              <th style={thStyle}>Pickup</th>
              <th style={thStyle}>Drop-off</th>
              <th style={thStyle}>Vehicle</th>
              <th style={thStyle}>Trip Value</th>
              <th style={thStyle}>Client Comm</th>
              <th style={thStyle}>Client VAT</th>
              <th style={thStyle}>Client Total</th>
              <th style={thStyle}>Driver Comm</th>
              <th style={thStyle}>Driver VAT</th>
              <th style={thStyle}>Driver Total</th>
              <th style={thStyle}>Client A/R Recovered</th>
              <th style={thStyle}>Driver A/R Recovered</th>
              <th style={thStyle}>Client Dep Before</th>
              <th style={thStyle}>Client Deducted</th>
              <th style={thStyle}>Remaining Client A/R</th>
              <th style={thStyle}>Driver Dep Before</th>
              <th style={thStyle}>Driver Deducted</th>
              <th style={thStyle}>Remaining Driver A/R</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => {
              const isVoided = job.voided === true;
              const rowStyle = isVoided
                ? { opacity: 0.45, textDecoration: "line-through" }
                : {};
              return (
                <tr key={i} style={rowStyle}>
                  <td style={tdStyle}>{job.jobNo}</td>
                  <td style={tdStyle}>{job.jobDate}</td>
                  <td style={tdStyle}>{job.clientName}</td>
                  <td style={tdStyle}>{job.driverName}</td>
                  <td style={tdStyle}>{job.pickupLocation}</td>
                  <td style={tdStyle}>{job.dropoffLocation}</td>
                  <td style={tdStyle}>{job.selectedVehicleType}</td>
                  <td style={tdStyle}>{job.tripValue}</td>
                  <td style={tdStyle}>{job.clientCommission}</td>
                  <td style={tdStyle}>{job.clientVat}</td>
                  <td style={tdStyle}>{job.clientTotalCharge}</td>
                  <td style={tdStyle}>{job.driverCommission}</td>
                  <td style={tdStyle}>{job.driverVat}</td>
                  <td style={tdStyle}>{job.driverTotalCharge}</td>
                  <td style={tdStyle}>{job.clientArRecovered}</td>
                  <td style={tdStyle}>{job.driverArRecovered}</td>
                  <td style={tdStyle}>{job.clientDepositBefore}</td>
                  <td style={tdStyle}>{job.clientDepositDeducted}</td>
                  <td style={tdStyle}>{job.clientArAfter}</td>
                  <td style={tdStyle}>{job.driverDepositBefore}</td>
                  <td style={tdStyle}>{job.driverDepositDeducted}</td>
                  <td style={tdStyle}>{job.driverArAfter}</td>
                  <td style={tdStyle}>
                    {isVoided ? (
                      <span style={{ color: "#999", fontWeight: "bold", fontSize: "11px" }}>VOID</span>
                    ) : (
                      <button
                        style={{ ...buttonStyle, padding: "4px 10px", fontSize: "12px" }}
                        onClick={() => handleStartEditJob(job)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Client Deposit Ledger</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job No</th><th style={thStyle}>Date</th><th style={thStyle}>Client ID</th>
              <th style={thStyle}>Client Name</th><th style={thStyle}>Description</th>
              <th style={thStyle}>Deposit In</th><th style={thStyle}>Deposit Out</th><th style={thStyle}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {clientDepositLedger.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{row.jobNo}</td><td style={tdStyle}>{row.jobDate}</td>
                <td style={tdStyle}>{row.clientId}</td><td style={tdStyle}>{row.clientName}</td>
                <td style={tdStyle}>{row.description}</td>
                <td style={tdStyle}>{row.depositIn.toFixed(2)}</td>
                <td style={tdStyle}>{row.depositOut.toFixed(2)}</td>
                <td style={tdStyle}>{row.runningBalance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Driver Deposit Ledger</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job No</th><th style={thStyle}>Date</th><th style={thStyle}>Driver ID</th>
              <th style={thStyle}>Driver Name</th><th style={thStyle}>Description</th>
              <th style={thStyle}>Deposit In</th><th style={thStyle}>Deposit Out</th><th style={thStyle}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {driverDepositLedger.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{row.jobNo}</td><td style={tdStyle}>{row.jobDate}</td>
                <td style={tdStyle}>{row.driverId}</td><td style={tdStyle}>{row.driverName}</td>
                <td style={tdStyle}>{row.description}</td>
                <td style={tdStyle}>{row.depositIn.toFixed(2)}</td>
                <td style={tdStyle}>{row.depositOut.toFixed(2)}</td>
                <td style={tdStyle}>{row.runningBalance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Client A/R Ledger</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job No</th><th style={thStyle}>Date</th><th style={thStyle}>Client ID</th>
              <th style={thStyle}>Client Name</th><th style={thStyle}>Description</th>
              <th style={thStyle}>A/R Increase</th><th style={thStyle}>A/R Recovery</th><th style={thStyle}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {clientArLedger.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{row.jobNo}</td><td style={tdStyle}>{row.jobDate}</td>
                <td style={tdStyle}>{row.clientId}</td><td style={tdStyle}>{row.clientName}</td>
                <td style={tdStyle}>{row.description}</td>
                <td style={tdStyle}>{row.arIncrease.toFixed(2)}</td>
                <td style={tdStyle}>{row.arRecovery.toFixed(2)}</td>
                <td style={tdStyle}>{row.runningBalance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Driver A/R Ledger</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job No</th><th style={thStyle}>Date</th><th style={thStyle}>Driver ID</th>
              <th style={thStyle}>Driver Name</th><th style={thStyle}>Description</th>
              <th style={thStyle}>A/R Increase</th><th style={thStyle}>A/R Recovery</th><th style={thStyle}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {driverArLedger.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{row.jobNo}</td><td style={tdStyle}>{row.jobDate}</td>
                <td style={tdStyle}>{row.driverId}</td><td style={tdStyle}>{row.driverName}</td>
                <td style={tdStyle}>{row.description}</td>
                <td style={tdStyle}>{row.arIncrease.toFixed(2)}</td>
                <td style={tdStyle}>{row.arRecovery.toFixed(2)}</td>
                <td style={tdStyle}>{row.runningBalance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #ddd" };
const buttonStyle = { backgroundColor: "#1e3a8a", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" };
const dangerButtonStyle = { backgroundColor: "#b91c1c", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "10px", marginTop: "6px", border: "1px solid #ccc", borderRadius: "6px", boxSizing: "border-box" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "12px" };
const thStyle = { border: "1px solid #ddd", padding: "8px", backgroundColor: "#f1f5f9", textAlign: "left" };
const tdStyle = { border: "1px solid #ddd", padding: "8px" };

export default App;
