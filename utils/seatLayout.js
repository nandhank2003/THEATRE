const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateSeatLayout = ({ 
  rows, 
  columns, 
  premiumRows = [],
  preferredRows = [],
  valueRows = [],
  wheelchairSeats = [],
}) => {
  if (rows * columns <= 0) {
    throw new Error("Seat layout requires positive row and column counts.");
  }

  if (rows > alphabet.length) {
    throw new Error("Seat generation supports up to 26 rows (A-Z).");
  }

  const layout = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowLabel = alphabet[rowIndex];
    const isPreferred = preferredRows.includes(rowLabel);
    const isValue = valueRows.includes(rowLabel);
    const isPremium = premiumRows.includes(rowLabel);
    
    for (let columnIndex = 1; columnIndex <= columns; columnIndex += 1) {
      const seatNumber = columnIndex.toString().padStart(2, "0");
      const seatId = `${rowLabel}${seatNumber}`;
      const isWheelchair = wheelchairSeats.some(ws => 
        ws.row === rowLabel && ws.column === columnIndex
      );
      
      let seatType = "standard";
      if (isWheelchair) seatType = "wheelchair";
      else if (isPremium) seatType = "premium";
      else if (isPreferred) seatType = "preferred";
      else if (isValue) seatType = "value";
      
      layout.push({
        seatId,
        row: rowLabel,
        column: columnIndex,
        seatType,
        isPremium: isPremium || isPreferred,
        isWheelchair,
        priceModifier: isPreferred ? 1 : isValue ? -2 : isPremium ? 2 : 0,
      });
    }
  }

  return layout;
};

export const SCREEN_BLUEPRINTS = [
  {
    name: "Screen 1",
    code: "screen1",
    rows: 10,
    columns: 40,
    totalSeats: 400,
    preferredRows: ["A", "B"], // Top rows - Preferred Sightline (+$1)
    standardRows: ["C", "D", "E"], // Middle rows - Standard Sightline
    valueRows: ["F", "G", "H", "I", "J"], // Bottom rows - Value Sightline (-$2)
    premiumRows: ["I", "J"], // Last rows also premium
    wheelchairSeats: [
      { row: "D", column: 20 },
      { row: "D", column: 21 },
    ],
  },
  {
    name: "Screen 2",
    code: "screen2",
    rows: 10,
    columns: 30,
    totalSeats: 300,
    preferredRows: ["A", "B"],
    standardRows: ["C", "D", "E"],
    valueRows: ["F", "G", "H", "I", "J"],
    premiumRows: ["H", "I", "J"],
    wheelchairSeats: [
      { row: "D", column: 15 },
      { row: "D", column: 16 },
    ],
  },
  {
    name: "Screen 3",
    code: "screen3",
    rows: 10,
    columns: 20,
    totalSeats: 200,
    preferredRows: ["A", "B"],
    standardRows: ["C", "D", "E"],
    valueRows: ["F", "G", "H", "I", "J"],
    premiumRows: ["G", "H", "I", "J"],
    wheelchairSeats: [
      { row: "D", column: 10 },
      { row: "D", column: 11 },
    ],
  },
  {
    name: "Screen 4 (Premium)",
    code: "screen4",
    rows: 10,
    columns: 10,
    totalSeats: 100,
    preferredRows: ["A", "B", "C", "D"],
    standardRows: ["E", "F"],
    valueRows: [],
    premiumRows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    wheelchairSeats: [
      { row: "E", column: 5 },
      { row: "E", column: 6 },
    ],
  },
];

export const getBlueprintByCode = (code) =>
  SCREEN_BLUEPRINTS.find((blueprint) => blueprint.code === code);

