export const aiNames = [
  // --- Shona Names ---
  "Kudzai", "Tadiwa", "Farai", "Nyasha", "Tendai", "Ruvimbo", "Chipo", "Tatenda", "Mufaro", "Rufaro",
  "Tinashe", "Kumbirayi", "Anesu", "Sekai", "Tafadzwa", "Munashe", "Panashe", "Tapiwa", "Vimbai", "Isheanesu",
  "Tanyaradzwa", "Rumbidzai", "Takunda", "Chengetai", "Mazvita", "Tariro", "Munya", "Nyeredzi", "Garikai", "Ruvarashe",
  "Farayi", "Shingai", "Simbarashe", "Tawananyasha", "Netsai", "Fadzai", "Zvikomborero", "Tariromunashe", "Makanaka", "Rudo",

  // --- Ndebele Names ---
  "Thandeka", "Sibusiso", "Bhekuzulu", "Nqobile", "Lindiwe", "Mthokozisi", "Gugu", "Senzangakhona", "Thulani", "Nomusa",
  "Dumiso", "Jabulani", "Khanyisile", "Mandla", "Nomalanga", "Sihle", "Thabani", "Vusumuzi", "Zanele", "Zenzo",
  "Ayanda", "Busisiwe", "Mlungisi", "Njabulo", "Sibonokuhle", "Sibongile", "Nhlalo", "Thandazile", "Qondile", "Bhekinkosi",
  "Nonjabulo", "Mthandazo", "Sindisiwe", "Thabitha", "Dumisile", "Phakamile", "Nokuthaba", "Siphilisa", "Thembekile", "Nompilo",

  // --- Zulu Names ---
  "Sipho", "Lungelo", "Mbali", "Nandi", "Zodwa", "Bheki", "Thembi", "Bandile", "Simphiwe", "Nokuthula",
  "Melusi", "Lwandle", "Sfiso", "Zanele", "Thabo", "Hlengiwe", "Siyabonga", "Dumisani", "Zonke", "Khaya",
  "Nonhlanhla", "Sizwe", "Mpendulo", "Khethiwe", "Bongani", "Lethabo", "Nkosana", "Thandolwethu", "Minhle", "Zinhle",
  "Sakhile", "Bawinile", "Nqaba", "Snethemba", "Mjabulelwa", "Nokwanda", "Sphesihle", "Zanelle", "Mpumi", "Thabisa",

  // --- English Names ---
  "James", "Sarah", "Victor", "Blessing", "Prudence", "Prince", "Grace", "Prosper", "Hope", "Joy",
  "Precious", "Gift", "Lovemore", "Patience", "Faith", "Bright", "Wisdom", "Fortune", "Charity",
  "Justice", "Liberty", "Mercy", "Praise", "Simba", "Oliver", "Amelia", "William", "Sophia", "Jacob",
  "Isabella", "Ethan", "Mia", "Alexander", "Charlotte", "Michael", "Harper", "Daniel", "Evelyn", "Matthew",

  // --- Spanish Names ---
  "Mateo", "Valentina", "Santiago", "Camila", "Matías", "Valeria", "Sebastián", "Isabella", "Leonardo", "Ximena",
  "Diego", "Daniela", "Thiago", "Sofia", "Emiliano", "María", "Julián", "Lucía", "Nicolás", "Victoria",
  "Lucas", "Martina", "Alejandro", "Luciana", "Benjamín", "Valeria", "Samuel", "Samantha", "Joaquín", "Gabriela",
  "Gabriel", "Mariana", "Tomás", "Antonella", "José", "Renata", "Miguel", "Emma", "David", "Catalina"
];

export const getRandomName = () => {
  return aiNames[Math.floor(Math.random() * aiNames.length)];
};
