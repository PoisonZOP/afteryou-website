/* ============================================================
   DATA FILE
   ============================================================ */
const PRICE_PLACEHOLDER = false;

const PRODUCTS = [
  /* New Category */
  {id:"p25", name:"D.I.Y Kakigōri", cat:"New", desc:"Customizable shaved ice dessert with your favorite toppings.", img:"assets/Menu/New/KG000_full.webp", sizes:[["Regular",225]]},
  {id:"p26", name:"Chocchip Cookie", cat:"New", desc:"Soft-baked cookie packed with rich chocolate chips.", img:"assets/Menu/New/TG574_full.webp", sizes:[["Regular",155]]},
  {id:"p27", name:"Milk Pudding", cat:"New", desc:"Silky smooth milk pudding with a delicate sweetness.", img:"assets/Menu/New/TG566_full.webp", sizes:[["Regular",85]]},
  {id:"p28", name:"Caramel Pudding", cat:"New", desc:"Classic velvety pudding served with golden caramel syrup.", img:"assets/Menu/New/TG567_full.webp", sizes:[["Regular",85]]},
  {id:"p29", name:"Milk Tea Pudding", cat:"New", desc:"Infused with aromatic Thai milk tea flavors.", img:"assets/Menu/New/TG568_full.webp", sizes:[["Regular",85]]},
  {id:"p30", name:"BB Taro Ball Kakigori", cat:"New", desc:"Shaved ice topped with chewy taro balls and boba.", img:"assets/Menu/New/KG067_full.webp", sizes:[["Regular",295]]},
  {id:"p31", name:"BB Taro Ball Milk Tea", cat:"New", desc:"Refreshing milk tea filled with handmade taro balls.", img:"assets/Menu/New/IT030_full.webp", sizes:[["Regular",175]]},

  /* Kakigōri Category */
  {id:"p01", name:"Strawberry Cheesecake Kakigōri", cat:"Kakigōri", desc:"Fluffy shaved ice filled with cheesecake bits and topped with fresh strawberry sauce.", img:"assets/Menu/Kakigōri/KG002.webp", sizes:[["Regular",305]]},
  {id:"p02", name:"Kinako Mochi Kakigōri x Vinefru Ginza", cat:"Kakigōri", desc:"Japanese roasted soybean powder with chewy mochi pieces.", img:"assets/Menu/Kakigōri/KG063.webp", sizes:[["Regular",305]]},
  {id:"p03", name:"Milo Volcano Kakigōri", cat:"Kakigōri", desc:"Rich chocolate malt shaved ice topped with Milo powder and condensed milk.", img:"assets/Menu/Kakigōri/KG001.webp", sizes:[["Regular",285]]},
  {id:"p04", name:"Thai Tea Kakigōri", cat:"Kakigōri", desc:"Signature Thai iced tea shaved ice with grass jelly and cream.", img:"assets/Menu/Kakigōri/KG006.webp", sizes:[["Regular",295]]},
  {id:"p05", name:"Mango Sticky Rice Kakigōri", cat:"Kakigōri", desc:"Fresh mango shaved ice layered with sweet coconut sticky rice.", img:"assets/Menu/Kakigōri/KG005.webp", sizes:[["Regular",305]]},

  /* Toast Category */
  {id:"p06", name:"Shibuya Honey Toast", cat:"Toast", desc:"Warm crispy butter toast served with vanilla ice cream and honey.", img:"assets/Menu/Toast/TO001.webp", sizes:[["Regular",235]]},
  {id:"p07", name:"Nutella Toast", cat:"Toast", desc:"Golden butter toast smothered in rich Nutella hazelnut spread.", img:"assets/Menu/Toast/TO008.webp", sizes:[["Regular",255]]},
  {id:"p08", name:"Ferrero Toast", cat:"Toast", desc:"Decadent chocolate toast topped with Ferrero Rocher and crushed nuts.", img:"assets/Menu/Toast/TO002.webp", sizes:[["Regular",305]]},
  {id:"p09", name:"Chocolate Toast with Strawberry", cat:"Toast", desc:"Fresh sliced strawberries paired with warm chocolate toast.", img:"assets/Menu/Toast/TO007.webp", sizes:[["Regular",275]]},
  {id:"p10", name:"Chocolate Toast with Banana", cat:"Toast", desc:"Sliced bananas drizzled over classic warm chocolate honey toast.", img:"assets/Menu/Toast/TO006.webp", sizes:[["Regular",275]]},
  {id:"p11", name:"Chocolate Toast", cat:"Toast", desc:"Signature toast baked with rich dark chocolate fudge.", img:"assets/Menu/Toast/TO010.webp", sizes:[["Regular",255]]},

  /* Signature Dessert Category */
  {id:"p12", name:"Chocolate Lava", cat:"Signature Dessert", desc:"Warm chocolate cake with a molten center, served with vanilla ice cream.", img:"assets/Menu/Signature Dessert/DE001.webp", sizes:[["Regular",195]]},
  {id:"p13", name:"Chocolate Mud Brownie", cat:"Signature Dessert", desc:"Fudgy chocolate brownie topped with whipped cream and cocoa powder.", img:"assets/Menu/Signature Dessert/DE005.webp", sizes:[["Regular",195]]},
  {id:"p14", name:"Strawberry Crumble", cat:"Signature Dessert", desc:"Warm baked strawberry filling topped with buttery crisp crumble.", img:"assets/Menu/Signature Dessert/DE007.webp", sizes:[["Regular",195]]},
  {id:"p15", name:"Figgy Pudding", cat:"Signature Dessert", desc:"Moist sponge cake served with warm butterscotch caramel sauce.", img:"assets/Menu/Signature Dessert/DE004.webp", sizes:[["Regular",195]]},
  {id:"p16", name:"Queen B Fudge Cake", cat:"Signature Dessert", desc:"Rich layered chocolate fudge cake for serious chocolate lovers.", img:"assets/Menu/Signature Dessert/DE006.webp", sizes:[["Regular",205]]},
  {id:"p17", name:"Double Choc Lava", cat:"Signature Dessert", desc:"Extra chocolate lava cake with double ice cream scoops.", img:"assets/Menu/Signature Dessert/DE002.webp", sizes:[["Regular",265]]},

  /* Croffle Category */
  {id:"p18", name:"Plain Croffle", cat:"Croffle", desc:"Butter croissant pressed in a waffle iron for maximum crispiness.", img:"assets/Menu/Croffle/DE039.webp", sizes:[["Regular",105]]},
  {id:"p19", name:"Croffle with Clotted Cream & Jam", cat:"Croffle", desc:"Crispy croffle served with velvety clotted cream and strawberry jam.", img:"assets/Menu/Croffle/DE038.webp", sizes:[["Regular",185]]},
  {id:"p20", name:"Plain Croffle with Fresh Cream", cat:"Croffle", desc:"Topped with whipped fresh cream and light powdered sugar.", img:"assets/Menu/Croffle/DE058.webp", sizes:[["Regular",125]]},

  /* Special Coffee Category */
  {id:"p21", name:"Dirty", cat:"Special Coffee", desc:"Cold milk topped with hot double shot espresso.", img:"assets/Menu/Specially coffee/DC076.webp", sizes:[["Regular",135]]},
  {id:"p22", name:"Dalgona Dirty", cat:"Special Coffee", desc:"Signature Dirty coffee layered with whipped Dalgona foam.", img:"assets/Menu/Specially coffee/DC077.webp", sizes:[["Regular",145]]},
  {id:"p23", name:"Santa's cookie Affogato", cat:"Special Coffee", desc:"Espresso poured over cookie crumb ice cream.", img:"assets/Menu/Specially coffee/DC074.webp", sizes:[["Regular",135]]},
  {id:"p24", name:"Kakigori Affogato", cat:"Special Coffee", desc:"Coffee dessert hybrid combining shaved ice and rich espresso.", img:"assets/Menu/Specially coffee/DC075.webp", sizes:[["Regular",145]]}
];

const CATEGORIES = ["Kakigōri","Toast","Signature Dessert","Croffle","Special Coffee","Hot Drinks","Hot Tea","Cold Drink","New","Other"];
const OTHER_SUBS = ["Merchandise","Frozen","Take Home","To-go"];

const BRANCHES = [
  {id:"b01", name:"After You Siam Square",       region:"South", dist:0.4, address:"Siam Square Soi 2, Pathum Wan, Bangkok 10330",      hours:"Daily 10:00–22:00", phone:"02 000 0001", x:46, y:58},
  {id:"b02", name:"After You Central Ladprao",     region:"North", dist:1.2, address:"Central Plaza Ladprao, 1691 Phahon Yothin Rd",     hours:"Daily 10:00–22:00", phone:"02 000 0002", x:54, y:22},
  {id:"b03", name:"After You Siam Paragon",        region:"South", dist:1.8, address:"Siam Paragon, 991 Rama I Rd, Pathum Wan",          hours:"Daily 10:00–22:00", phone:"02 000 0003", x:49, y:53},
  {id:"b04", name:"After You Central Rama 3",      region:"South", dist:2.1, address:"Central Plaza Rama 3, Yan Nawa, Bangkok 10120",    hours:"Daily 10:00–22:00", phone:"02 000 0004", x:58, y:72},
  {id:"b05", name:"After You Union Mall",          region:"North", dist:2.8, address:"Union Mall, 54 Lat Phrao Soi 1, Chatuchak",        hours:"Daily 11:00–22:00", phone:"02 000 0005", x:57, y:14},
  {id:"b06", name:"After You ICONSIAM",            region:"West",  dist:3.2, address:"ICONSIAM, 299 Charoen Nakhon Rd, Khlong San",      hours:"Daily 10:00–22:00", phone:"02 000 0006", x:30, y:66},
  {id:"b07", name:"After You Central Bangna",      region:"East",  dist:3.4, address:"Central Plaza Bangna, 587 Bangna-Trad Rd",         hours:"Daily 10:00–22:00", phone:"02 000 0007", x:76, y:70},
  {id:"b08", name:"After You Terminal 21 Rama 3",  region:"South", dist:3.9, address:"Terminal 21 Rama 3, Thung Maha Mek, Sathon",        hours:"Daily 10:00–22:00", phone:"02 000 0008", x:55, y:78},
  {id:"b09", name:"After You CDC",                 region:"North", dist:4.5, address:"Crystal Design Center, 1420/1 Pradit Manutham Rd", hours:"Daily 10:00–21:00", phone:"02 000 0009", x:68, y:20},
  {id:"b10", name:"After You Seacon Square",       region:"East",  dist:5.8, address:"Seacon Square, 904 Srinagarindra Rd, Prawet",      hours:"Daily 10:00–22:00", phone:"02 000 0010", x:78, y:60},
  {id:"b11", name:"After You The Market Ratchada", region:"North", dist:6.1, address:"The Market Ratchada, Din Daeng, Bangkok 10400",    hours:"Daily 11:00–23:00", phone:"02 000 0011", x:53, y:38},
  {id:"b12", name:"After You Central Pinklao",     region:"West",  dist:6.7, address:"Central Plaza Pinklao, Borommaratchachonnani Rd",  hours:"Daily 10:00–22:00", phone:"02 000 0012", x:26, y:38},
  {id:"b13", name:"After You Megabangna",          region:"East",  dist:7.2, address:"Megabangna, 39 Bangna-Trad Rd, Bang Phli",         hours:"Daily 10:00–22:00", phone:"02 000 0013", x:86, y:74},
  {id:"b14", name:"After You The Circle Ratchaphruek", region:"West", dist:8.4, address:"The Circle Ratchaphruek, 39 Ratchaphruek Rd",  hours:"Daily 10:00–22:00", phone:"02 000 0014", x:20, y:52},
  {id:"b15", name:"After You Fashion Island",      region:"North", dist:9.3, address:"Fashion Island, 587 Ramintra Rd, Khan Na Yao",     hours:"Daily 10:00–22:00", phone:"02 000 0015", x:70, y:10},
  {id:"b16", name:"After You Terminal 21 Pattaya", region:"East",  dist:12.5, address:"Terminal 21 Pattaya, 456 Moo 6, Bang Lamung",     hours:"Daily 10:00–22:00", phone:"038 000 016", x:92, y:40}
];

const FAQ_GENERAL = [
  {q:"How do I earn and redeem membership points?",
   a:"Members earn one point for every ฿100 spent in store or online. Points can be redeemed for desserts and drinks once you reach 100 points. Show your member QR code at the counter, or sign in before checkout to collect points on an online order."},
  {q:"Where are your branches located?",
   a:"We operate branches across Bangkok and in a number of provincial areas. Use the Branches page to search by city or area, filter by distance, and see each branch's opening hours, address and phone number."},
  {q:"Can I buy a gift voucher?",
   a:"Yes. Gift vouchers are available at every branch counter in fixed denominations. Vouchers are valid for twelve months from the date of purchase and can be used for dine-in, takeaway and online orders."},
  {q:"How can I order online?",
   a:""}
];

const FAQ_INVESTOR = [
  {q:"How can I follow the company's IR news?",
   a:"Investor relations news, announcements and financial reports are published on the Investor Relations section of our corporate website. You can also subscribe to email alerts there to receive new disclosures as they are released."},
  {q:"How do I submit a proxy for the shareholder meeting?",
   a:"Proxy forms are included with the meeting notice sent to shareholders of record. Complete the form and return it to the registrar by the deadline stated in the notice, or attend the meeting in person."},
  {q:"When is the dividend paid?",
   a:"Dividends are normally paid within one month of the resolution being approved at the shareholders' meeting. The payment date and record date are announced in advance through the Stock Exchange of Thailand disclosure channel."},
  {q:"What is the company's dividend policy?",
   a:"The company aims to pay dividends of no less than 40% of net profit after tax, subject to cash flow, investment plans and any legal or contractual restrictions. The board reviews the policy annually."}
];

const CONTACT = {
  headOffice:{
    address:"After You Dessert Cafe — Head Office, 123 Sukhumvit Road, Khlong Toei, Bangkok 10110, Thailand",
    phone:"02 000 0000",
    fax:"02 000 0001",
    email:"contactus@afteryou.co.th"
  },
  departments:[
    {name:"Franchise Contact", phone:"02 000 0100", email:"franchise@afteryou.co.th"},
    {name:"Purchasing Department", phone:"02 000 0200", email:"purchasing@afteryou.co.th"},
    {name:"Job Application", phone:"02 000 0300", email:"careers@afteryou.co.th"},
    {name:"Mikka Franchise", phone:"02 000 0400", email:"mikka@afteryou.co.th"},
    {name:"Catering and Snack Box", line:"@afteryoucafe", email:"catering@afteryou.co.th"}
  ]
};