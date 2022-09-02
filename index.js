let ORGANIZATION_ID;
const BASE_URL = `https://bank.hackclub.com/api/v3`;
let size;
const red = new Color("#ec3750");
const gray = new Color("#8492a6");
const greenLine = Color.dynamic(
  new Color("#33d6a6", 0.125),
  new Color("#33d6a6", 0.25)
);
const redLine = Color.dynamic(
  new Color("#ec3750", 0.125),
  new Color("#891a2a", 0.25)
);

const fetchData = async (path = "") => {
  const req = new Request(
    `${BASE_URL}/organizations/${ORGANIZATION_ID}${path}`
  );
  const data = await req.loadJSON();
  if (req.response.statusCode == 404) {
    throw new Error(
      "Organization not found. Make sure you entered the correct organization ID or slug."
    );
  }
  return data;
};

const convertCents = (cents) => (cents / 100).toFixed(2);

const createWidget = async (size) => {
  const widget = new ListWidget();
  const data = await fetchData();
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.topAlignContent();
  const title = mainStack.addText(data.name);
  title.textColor = red;
  title.font = Font.semiboldSystemFont(12);
  const balanceCents = data.balances.balance_cents;
  const balanceStack = mainStack.addStack();
  const dollarSign = balanceStack.addText("$");
  dollarSign.textColor = gray;
  dollarSign.font = Font.lightSystemFont(16);
  const balanceText = balanceStack.addText(`${convertCents(balanceCents)}`);
  balanceText.font = Font.semiboldSystemFont(27);
  balanceText.minimumScaleFactor = 0.1;
  mainStack.addSpacer(4);
  const transactionsTitle = mainStack.addText("Recent Transactions");
  transactionsTitle.font = Font.semiboldSystemFont(10);
  transactionsTitle.textColor = gray;
  const transactions = await fetchData(
    `/transactions?per_page=${size === "large" ? 11 : 3}`
  );
  for (const transaction of transactions) {
    const transactionItem = mainStack.addStack();
    transactionItem.centerAlignContent();
    transactionItem.backgroundColor =
      transaction.amount_cents >= 0 ? greenLine : redLine;
    transactionItem.setPadding(2, 4, 2, 4);
    const transactionAmount = transactionItem.addStack();
    if (size !== "small") {
      transactionAmount.size = new Size(100, 0);
    }
    const transactionAmountText = transactionAmount.addText(
      `${transaction.amount_cents < 0 ? "-" : "+"}$${convertCents(
        Math.abs(transaction.amount_cents)
      )}`
    );
    transactionAmountText.font =
      size === "small" ? Font.regularSystemFont(16) : Font.mediumSystemFont(16);
    transactionAmountText.lineLimit = 1;
    if (size !== "small") {
      transactionAmount.addSpacer();
      const transactionMemo = transactionItem.addText(transaction.memo);
      transactionMemo.font = Font.regularSystemFont(16);
      transactionMemo.lineLimit = 1;
    }

    transactionItem.addSpacer();
  }
  if (
    ((size === "small" || size == "medium") && transactions.length < 3) ||
    (size === "large" && transactions.length < 11)
  ) {
    mainStack.addSpacer();
  }
  return widget;
};

let w;
if (!config.runsInWidget) {
  if (!args.queryParameters.id) {
    throw new Error(
      `To run this script in the app, go to ${URLScheme.forRunningScript()}?id=your_org_id, replacing your_org_id with your Hack Club Bank organization's ID or slug. Or, run the script as a widget.`
    );
  }
  ORGANIZATION_ID = args.queryParameters.id;
  if (["small", "medium", "large"].includes(args.queryParameters.size)) {
    size = args.queryParameters.size;
  }
  w = await createWidget(size);
  if (size === "small") {
    w.presentSmall();
  } else if (size === "large") {
    w.presentLarge();
  } else {
    w.presentMedium();
  }
} else {
  if (!args.widgetParameter) {
    throw new Error(
      "Enter your Hack Club Bank organization's ID or slug as the widget parameter."
    );
  }
  ORGANIZATION_ID = args.widgetParameter;
  size = config.widgetFamily;
  if (!size) {
    size = "medium";
  }
  w = await createWidget(size);
}
Script.setWidget(w);
