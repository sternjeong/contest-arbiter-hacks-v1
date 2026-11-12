// SortLocal rule catalog: the human-authored source of truth.
//
// Every city rule points at a record in an official source snapshot
// (rules-src/snapshots/*). `build-rules.mjs` resolves each pointer, checks
// that the quoted text really appears in the snapshot, and writes the
// public rulesets to src/rules/*.json.
//
// Source pointer helpers:
//   sf(slug, q?)            SF Environment "SF Recycles" item page
//   sfp(q)                  SF Environment trilingual poster PDF (2023)
//   sea(name, field, q?)    Seattle Public Utilities "Where Does It Go?" record + field
//   tor(title, kw?)         City of Toronto Waste Wizard record (+ the keyword that matched)
// `q` is an optional verbatim excerpt; without it the build quotes the start of the record.
//
// Rule shape: R(bin, src, { prep, cond, variants, verified, note })
// bins: recycling | compost | garbage | special | reuse

export const sf = (key, q) => ({ doc: 'sf-sfrecycles', key, q });
export const sfp = (q) => ({ doc: 'sf-poster', q });
export const sea = (key, field, q) => ({ doc: 'sea-wdig', key, field, q });
export const tor = (key, kw) => ({ doc: 'tor-ww', key, kw });
const R = (bin, src, opts = {}) => ({ bin, src, ...opts });
const V = (when, bin, src) => ({ when, bin, src });

/** @type {Array<{id:string,name:string,category:string,material:string,unitMassG:number,synonyms:string[],rules:Record<string,any>}>} */
export const items = [
  // ───────────────────────── Paper & cardboard ─────────────────────────
  {
    id: 'cardboard-box', name: 'Cardboard box', category: 'Paper', material: 'corrugated', unitMassG: 400,
    synonyms: ['corrugated cardboard', 'shipping box', 'amazon box', 'moving box', 'brown box', 'carton box'],
    rules: {
      sf: R('recycling', sf('cardboard'), { prep: ['Break down the box', 'Cut away greasy or wet parts'], cond: ['flatten', 'clean', 'dry'],
        variants: [V('greasy or food-soiled', 'compost', sfp('Greasy pizza boxes and paper bags'))] }),
      seattle: R('recycling', sea('Cardboard Boxes', 'Recycling'), { prep: ['Flatten', 'Tape and labels can stay on', 'Remove packing materials inside'], cond: ['flatten', 'dry'],
        variants: [V('greasy, oily or mostly wet', 'compost', sea('Cardboard Boxes', 'Foodandyard'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Cardboard Boxes)', 'cardboard boxes'), { prep: ['Flatten', 'No larger than 60 x 60 cm'], cond: ['flatten'],
        variants: [V('food-soiled', 'compost', tor('soiled pizza box', 'pizza boxes (food-soiled)'))] }),
    },
  },
  {
    id: 'pizza-box', name: 'Pizza box (greasy)', category: 'Paper', material: 'corrugated', unitMassG: 250,
    synonyms: ['greasy pizza box', 'pizza box', 'food-soiled cardboard', 'oily box'],
    rules: {
      sf: R('compost', sf('greasy-pizza-boxes'), { variants: [V('clean, no grease', 'recycling', sf('cardboard'))] }),
      seattle: R('compost', sea('Pizza Boxes', 'Foodandyard'), { prep: ['Remove anything that is not paper or cardboard'] }),
      toronto: R('compost', tor('soiled pizza box', 'pizza boxes (food-soiled)'), { prep: ['Remove plastic pieces (they go in the garbage)'],
        variants: [V('clean, no grease', 'recycling', tor('NEW Blue Bin (Cardboard Boxes)', 'pizza boxes (unsoiled)'))] }),
    },
  },
  {
    id: 'cereal-box', name: 'Cereal box / boxboard', category: 'Paper', material: 'mixed-paper', unitMassG: 60,
    synonyms: ['cracker box', 'pasta box', 'boxboard', 'paperboard box', 'shoe box', 'tissue box', 'cereal box'],
    rules: {
      sf: R('recycling', sf('cereal-boxes'), { prep: ['Remove the plastic liner'], cond: ['remove-liner'] }),
      seattle: R('recycling', sea('Cereal or Cracker Boxes', 'Recycling'), { prep: ['Empty it', 'Plastic liners and trays go in the garbage'], cond: ['clean', 'empty', 'remove-liner'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Boxboard)', 'cereal boxes'), { prep: ['Flatten', 'Empty it'], cond: ['flatten', 'empty'] }),
    },
  },
  {
    id: 'newspaper', name: 'Newspaper', category: 'Paper', material: 'newspaper', unitMassG: 250,
    synonyms: ['newsprint', 'flyers', 'newspapers', 'paper'],
    rules: {
      sf: R('recycling', sf('newspapers-magazines')),
      seattle: R('recycling', sea('Newspapers', 'Recycling'), { variants: [V('wet or food-soiled', 'compost', sea('Newspapers', 'Foodandyard'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'newspapers'), { prep: ['Remove plastic bags and elastic bands'] }),
    },
  },
  {
    id: 'magazine', name: 'Magazine / catalog', category: 'Paper', material: 'magazines', unitMassG: 200,
    synonyms: ['catalog', 'catalogue', 'glossy paper', 'magazines'],
    rules: {
      sf: R('recycling', sf('newspapers-magazines')),
      seattle: R('recycling', sea('Magazines', 'Recycling')),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'magazines')),
    },
  },
  {
    id: 'junk-mail', name: 'Junk mail & envelopes', category: 'Paper', material: 'mixed-paper', unitMassG: 30,
    synonyms: ['envelope', 'envelopes', 'mail', 'letters', 'window envelope', 'office paper', 'printer paper', 'sticky notes'],
    rules: {
      sf: R('recycling', sfp('Clean, dry paper, junk mail, sticky notes, magazines'), { prep: ['Envelopes with windows are OK'], cond: ['clean', 'dry'] }),
      seattle: R('recycling', sea('Junk Mail', 'Recycling'), { prep: ['Open and separate junk mail'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'junk mail')),
    },
  },
  {
    id: 'shredded-paper', name: 'Shredded paper', category: 'Paper', material: 'office-paper', unitMassG: 200,
    synonyms: ['shredded documents', 'paper shreds', 'shredder paper'],
    rules: {
      sf: R('recycling', sfp('Shredded paper (place in sealed paper bag and label “Shredded Paper”)'), { prep: ['Seal in a paper bag', 'Label it “Shredded Paper”'], cond: ['bag-shredded'],
        note: 'From the 2023 SF Environment poster; not on a current SF Recycles item page.' }),
      seattle: R('recycling', sea('Shredded Paper', 'Recycling'), { prep: ['Small amounts only, contained in a paper bag', 'Drop-off at a collection site is preferred'], cond: ['bag-shredded'],
        note: 'SPU says drop-off is the best option and that loose shreds contaminate other recyclables.' }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'shredded paper'), { prep: ['Place in a tied clear plastic bag'], cond: ['bag-shredded'] }),
    },
  },
  {
    id: 'paper-bag', name: 'Paper bag', category: 'Paper', material: 'mixed-paper', unitMassG: 50,
    synonyms: ['kraft bag', 'grocery paper bag', 'brown paper bag', 'paper shopping bag'],
    rules: {
      sf: R('recycling', sf('paper-bags'), { cond: ['clean', 'dry'], variants: [V('greasy or food-stained', 'compost', sf('paper-bags', 'For greasy or food-stained paper, place in the green composting bin.'))] }),
      seattle: R('recycling', sea('Paper Bags', 'Recycling'), { cond: ['clean', 'dry'], variants: [V('food-soiled', 'compost', sea('Paper Bags', 'Foodandyard'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper Laminate Packaging)', 'paper bags (unsoiled)'), { cond: ['clean'],
        variants: [V('food-soiled', 'compost', tor('Green Bin (food-soiled bags w/ handles)', 'paper bags (food-soiled)'))] }),
    },
  },
  {
    id: 'paper-coffee-cup', name: 'Paper coffee cup', category: 'Paper', material: 'mixed-paper', unitMassG: 12,
    synonyms: ['coffee cup', 'to-go cup', 'hot cup', 'paper cup', 'cup sleeve', 'takeaway cup', 'starbucks cup'],
    rules: {
      sf: R('recycling', sf('paper-coffee-cups-empty'), { prep: ['Empty it', 'Sleeve and plastic lid can go in too'], cond: ['empty'] }),
      seattle: R('recycling', sea('Hot or To-Go Beverage Cups', 'Recycling'), { prep: ['Empty and dry'], cond: ['empty', 'dry'],
        variants: [V('stained with liquid (non-compostable cup)', 'garbage', sea('Hot or To-Go Beverage Cups', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper Laminate Containers)', 'paper coffee cups'), { prep: ['Empty it', 'Remove the lid'], cond: ['empty', 'clean', 'lid-off'] }),
    },
  },
  {
    id: 'milk-carton', name: 'Milk carton (gable top)', category: 'Paper', material: 'mixed-paper', unitMassG: 30,
    synonyms: ['gable top carton', 'juice carton', 'soy milk carton', 'almond milk carton', 'cream carton', 'milk carton'],
    rules: {
      sf: R('recycling', sfp('Empty paper milk cartons'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Milk, Juice, or Soup Cartons', 'Recycling'), { cond: ['empty', 'clean', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Cartons)', 'milk cartons'), { prep: ['Empty it', 'Leave the lid on'], cond: ['empty', 'clean', 'lid-on'] }),
    },
  },
  {
    id: 'juice-box', name: 'Juice box / Tetra Pak', category: 'Paper', material: 'mixed-paper', unitMassG: 12,
    synonyms: ['tetra pak', 'aseptic carton', 'soup carton', 'broth carton', 'drink box', 'juice box'],
    rules: {
      sf: R('recycling', sfp('Empty soup and juice boxes (aseptic containers)'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Aseptic or Tetra Pak Cartons', 'Recycling'), { prep: ['Empty it', 'Remove caps and put them in the garbage'], cond: ['empty', 'lid-off'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Cartons)', 'juice boxes'), { prep: ['Empty it', 'Leave the lid on'], cond: ['empty', 'clean', 'lid-on'] }),
    },
  },
  {
    id: 'egg-carton-paper', name: 'Paper egg carton', category: 'Paper', material: 'mixed-paper', unitMassG: 35,
    synonyms: ['egg carton', 'egg box', 'molded pulp carton', 'cardboard egg carton', 'egg tray'],
    rules: {
      sf: R('recycling', sf('egg-cartons')),
      seattle: R('compost', sea('Egg Cartons', 'Foodandyard')),
      toronto: R('recycling', tor('NEW Blue Bin (Boxboard)', 'paper egg cartons')),
    },
  },
  {
    id: 'paper-towel', name: 'Paper towels & napkins', category: 'Paper', material: 'mixed-organics', unitMassG: 5,
    synonyms: ['napkin', 'serviette', 'kitchen roll', 'paper napkin', 'paper towel'],
    rules: {
      sf: R('compost', sf('paper-towels')),
      seattle: R('compost', sea('Paper Towels', 'Foodandyard'), { variants: [V('used with cleaning products or bodily fluids', 'garbage', sea('Paper Towels', 'Garbage'))] }),
      toronto: R('compost', tor('Green Bin - if soiled w chem, then garbage', 'paper towels'), { variants: [V('soiled with chemicals', 'garbage', tor('Green Bin - if soiled w chem, then garbage', 'paper towels'))] }),
    },
  },
  {
    id: 'tissues', name: 'Used facial tissues', category: 'Hygiene', material: 'mixed-organics', unitMassG: 3,
    synonyms: ['kleenex', 'facial tissue', 'used tissue', 'tissues'],
    rules: {
      sf: R('compost', sf('tissues')),
      seattle: R('garbage', sea('Facial Tissue (Kleenex)', 'Garbage')),
      toronto: R('compost', tor('Green Bin - if soiled w chem, then garbage', 'facial tissues')),
    },
  },
  {
    id: 'paper-plate', name: 'Paper plate (food-soiled)', category: 'Paper', material: 'mixed-organics', unitMassG: 15,
    synonyms: ['dirty paper plate', 'chinet plate', 'paper bowl', 'paper plate'],
    rules: {
      sf: R('compost', sf('paper-plates')),
      seattle: R('compost', sea('Paper Plates or Cups', 'Foodandyard', 'Uncoated (not shiny) paper plates (such as Chinet brand)'), {
        variants: [V('shiny plastic coating and dirty', 'garbage', sea('Paper Plates or Cups', 'Garbage'))] }),
      toronto: R('compost', tor('GB - Paper - food-soiled, unwaxed/unlined', 'paper plates (food-soiled)'), {
        variants: [V('lined with wax or plastic', 'garbage', tor('GB - Paper - food-soiled, unwaxed/unlined', 'paper plates (food-soiled)'))] }),
    },
  },
  {
    id: 'cardboard-tube', name: 'Toilet paper / paper towel tube', category: 'Paper', material: 'mixed-paper', unitMassG: 10,
    synonyms: ['toilet paper roll', 'paper towel roll', 'cardboard tube', 'tp roll'],
    rules: {
      sf: R('recycling', sf('cardboard-tubes')),
      seattle: R('recycling', sea('Paper Towel Tubes, Toilet Paper Tubes, Cardboard Tubes', 'Recycling')),
      toronto: R('recycling', tor('NEW Blue Bin (Boxboard)', 'toilet paper rolls')),
    },
  },
  {
    id: 'wrapping-paper', name: 'Wrapping paper', category: 'Paper', material: 'mixed-paper', unitMassG: 50,
    synonyms: ['gift wrap', 'gift wrapping paper', 'christmas wrapping', 'birthday wrapping'],
    rules: {
      sf: R('recycling', sf('wrapping-paper-non-metallic'), { prep: ['Non-metallic only'] }),
      seattle: R('recycling', sea('Gift Wrap', 'Recycling'), { cond: ['clean', 'dry'], variants: [V('foil or plastic gift wrap', 'garbage', sea('Gift Wrap', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'gift wrapping paper'), { note: 'Toronto also lists metallic gift wrapping paper as Blue Bin.' }),
    },
  },
  {
    id: 'receipt', name: 'Receipt (shiny thermal paper)', category: 'Paper', material: 'mixed-paper', unitMassG: 2,
    synonyms: ['till receipt', 'cash register receipt', 'sales receipt', 'thermal paper', 'receipts'],
    rules: {
      seattle: R('garbage', sea('Receipts', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Paper)', 'sales receipts (shiny/thermal paper)')),
    },
  },
  {
    id: 'hardcover-book', name: 'Hardcover book', category: 'Paper', material: 'office-paper', unitMassG: 600,
    synonyms: ['book', 'hardback', 'textbook', 'novel', 'books'],
    rules: {
      sf: R('reuse', sf('books-reusable'), { prep: ['Donate to a thrift store or the Friends of the SF Public Library'] }),
      seattle: R('garbage', sea('Hardcover Books', 'Garbage'), { prep: ['Donate if in good condition', 'Pages can be recycled once the cover and binding are removed'] }),
      toronto: R('garbage', tor('Garbage or Donate CED (books)', 'hardcover books'), { prep: ['Donate if in good condition'] }),
    },
  },
  {
    id: 'ice-cream-carton', name: 'Paper ice cream container', category: 'Paper', material: 'mixed-paper', unitMassG: 40,
    synonyms: ['ice cream tub paper', 'ice cream carton', 'ice cream box'],
    rules: {
      sf: R('recycling', sfp('Empty paper ice cream containers'), { cond: ['empty'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Paper Laminate Containers)', 'paper ice cream boxes/cartons'), { prep: ['Empty it', 'Remove the lid'], cond: ['empty', 'clean', 'lid-off'] }),
    },
  },
  {
    id: 'frozen-food-box', name: 'Frozen food box', category: 'Paper', material: 'mixed-paper', unitMassG: 60,
    synonyms: ['frozen dinner box', 'freezer box', 'frozen pizza box'],
    rules: {
      seattle: R('recycling', sea('Frozen Food Boxes', 'Recycling'), { cond: ['clean', 'empty', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Boxboard)', 'frozen food box'), { cond: ['flatten', 'empty'] }),
    },
  },

  // ───────────────────────── Metal ─────────────────────────
  {
    id: 'aluminum-can', name: 'Aluminum drink can', category: 'Metal', material: 'aluminum', unitMassG: 15,
    synonyms: ['soda can', 'pop can', 'drink can', 'beverage can', 'coke can', 'aluminium can', 'can'],
    rules: {
      sf: R('recycling', sf('aluminum-cans'), { prep: ['Empty it'], cond: ['empty'] }),
      seattle: R('recycling', sea('Food and Beverage Cans', 'Recycling', 'Beverage cans: Empty soda and beverage cans go in the recycling. Crushed aluminum cans are ok to recycle.'), { cond: ['empty'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Metal)', 'aluminum cans'), { prep: ['Empty and rinse', 'Beer and other alcohol cans go back to The Beer Store'], cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'beer-can', name: 'Beer / alcohol can', category: 'Metal', material: 'aluminum', unitMassG: 15,
    synonyms: ['beer can', 'cider can', 'seltzer can', 'alcohol can', 'hard seltzer'],
    rules: {
      sf: R('recycling', sf('aluminum-cans'), { cond: ['empty'], note: 'California CRV containers can also be redeemed at a recycling center.' }),
      seattle: R('recycling', sea('Food and Beverage Cans', 'Recycling', 'Beverage cans: Empty soda and beverage cans go in the recycling.'), { cond: ['empty'] }),
      toronto: R('special', tor('Deposit Return to Beer Store', 'beer cans'), { prep: ['Return to The Beer Store for the deposit'] }),
    },
  },
  {
    id: 'steel-can', name: 'Food can (steel / tin)', category: 'Metal', material: 'steel', unitMassG: 50,
    synonyms: ['tin can', 'soup can', 'tuna can', 'food tin', 'pet food can', 'bean can', 'canned food'],
    rules: {
      sf: R('recycling', sfp('Steel (tin) cans'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Steel or Tin Cans', 'Recycling'), { prep: ['Empty, rinse, dry', 'Keep the lid partly attached or push it inside the can'], cond: ['empty', 'clean', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Metal)', 'food cans'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'aluminum-foil', name: 'Aluminum foil', category: 'Metal', material: 'aluminum', unitMassG: 10,
    synonyms: ['tin foil', 'foil', 'alfoil', 'kitchen foil', 'aluminium foil'],
    rules: {
      sf: R('recycling', sf('aluminum-foil'), { prep: ['Ball it up', 'No food'], cond: ['clean', 'ball-up'] }),
      seattle: R('recycling', sea('Aluminum Foil', 'Recycling'), { prep: ['Clean and dry', 'Ball it up bigger than 3 inches'], cond: ['clean', 'dry', 'ball-up', 'min-3in'],
        variants: [V('dirty or food-covered', 'garbage', sea('Aluminum Foil', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Aluminum Foil and Trays)', 'aluminum foil'), { prep: ['Remove food', 'Ball it up'], cond: ['clean', 'ball-up'] }),
    },
  },
  {
    id: 'aluminum-tray', name: 'Aluminum tray / pie plate', category: 'Metal', material: 'aluminum', unitMassG: 30,
    synonyms: ['foil tray', 'roasting pan', 'pie tin', 'aluminum container', 'takeout foil container'],
    rules: {
      sf: R('recycling', sf('aluminum-containers-trays')),
      seattle: R('recycling', sea('Aluminum Foil', 'Recycling', 'Aluminum food pans Foil and trays must be empty, clean, and dry'), { cond: ['empty', 'clean', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Aluminum Foil and Trays)', 'aluminum trays'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'aerosol-can', name: 'Aerosol can (empty)', category: 'Metal', material: 'steel', unitMassG: 60,
    synonyms: ['spray can', 'hairspray can', 'whipped cream can', 'air freshener can', 'deodorant spray', 'shaving cream can'],
    rules: {
      sf: R('special', sf('spray-cans-empty'), { verified: false,
        note: 'Sources disagree: the current SF Recycles page says special handling, but the 2023 SF Environment poster lists “Spray cans (must be empty)” under Recycle. Call Recology to confirm.' }),
      seattle: R('recycling', sea('Aerosol Cans', 'Recycling'), { prep: ['Non-hazardous contents only', 'Must be completely empty of contents and pressure'], cond: ['empty'],
        variants: [V('held paint, solvent or other hazardous product', 'special', sea('Aerosol Cans', 'Hazardous'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Aerosol Containers)', 'aerosol cans (empty)'), { prep: ['Empty', 'Lid on'], cond: ['empty', 'lid-on'],
        variants: [V('still contains product', 'special', tor('NEW Blue Bin (Aerosol Containers)', 'aerosol cans (empty)'))] }),
    },
  },
  {
    id: 'metal-jar-lid', name: 'Metal jar lid', category: 'Metal', material: 'steel', unitMassG: 6,
    synonyms: ['jar lid', 'metal lid', 'metal cap', 'mason jar lid', 'twist-off lid'],
    rules: {
      sf: R('recycling', sf('jar-lids')),
      seattle: R('garbage', sea('Bottle Caps and Jar Lids', 'Garbage'), { prep: ['Loose lids 3 inches or wider can be recycled'],
        variants: [V('3 inches (7.6 cm) or wider', 'recycling', sea('Bottle Caps and Jar Lids', 'Recycling', 'Loose plastic and metal lids 3 inches in diameter or larger'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Metal)', 'glass jar lids')),
    },
  },
  {
    id: 'plastic-bottle-cap', name: 'Loose plastic bottle cap', category: 'Plastic', material: 'pp', unitMassG: 2,
    synonyms: ['bottle cap', 'plastic cap', 'bottle top', 'screw cap'],
    rules: {
      sf: R('recycling', sf('bottle-caps'), { prep: ['Best: leave caps screwed on bottles'] }),
      seattle: R('garbage', sea('Bottle Caps and Jar Lids', 'Garbage', 'Loose plastic bottle caps less than 3 inches in diameter'), {
        variants: [V('screwed onto an empty plastic bottle', 'recycling', sea('Bottle Caps and Jar Lids', 'Recycling', 'Small plastic bottle caps if screwed onto an empty plastic bottle can be put into the recycling'))] }),
    },
  },
  {
    id: 'pots-pans', name: 'Metal pot or pan', category: 'Metal', material: 'steel', unitMassG: 1000,
    synonyms: ['frying pan', 'saucepan', 'cookware', 'skillet', 'baking tray', 'pan', 'pot'],
    rules: {
      seattle: R('recycling', sea('Pots or Pans', 'Recycling'), { prep: ['Donate if still usable'] }),
      toronto: R('garbage', tor('Metal items - donate, GARBAGE or Depot', 'cooking pots/pans (any material)'), { prep: ['Donate if still usable', 'Some Drop-Off Depots take metal pots/pans as scrap metal'] }),
    },
  },
  {
    id: 'paint-can-empty', name: 'Empty paint can', category: 'Metal', material: 'steel', unitMassG: 300,
    synonyms: ['paint tin', 'empty paint tin', 'metal paint can'],
    rules: {
      sf: R('recycling', sf('house-paint', 'Recycle empty and dry small paint cans in blue recycling bin.'), { cond: ['empty', 'dry'] }),
      seattle: R('garbage', sea('Paint, Paint Thinner, and Paint Cans', 'Garbage', 'Empty paint cans cannot be cleaned enough to recycle and should go out in the garbage.'), { prep: ['Leave the lid off so collectors can see it is empty/dry'] }),
      toronto: R('special', tor('HHW (empty paint cans)', 'empty paint can'), { prep: ['Take to a Drop-Off Depot or Community Environment Day'] }),
    },
  },
  {
    id: 'wire-hanger', name: 'Wire coat hanger', category: 'Metal', material: 'steel', unitMassG: 40,
    synonyms: ['coat hanger', 'metal hanger', 'dry cleaner hanger', 'clothes hanger'],
    rules: {
      sf: R('garbage', sfp('Wire hangers: take back to a garment cleaner for reuse'), { prep: ['Better: return to a dry cleaner for reuse'] }),
      seattle: R('garbage', sea('Wire Clothes Hangers', 'Garbage'), { prep: ['Better: donate or return to a dry cleaner'] }),
      toronto: R('garbage', tor('Garbage (laundry and cleaning)', 'wire hangers')),
    },
  },

  // ───────────────────────── Glass ─────────────────────────
  {
    id: 'glass-bottle', name: 'Glass bottle (non-alcohol)', category: 'Glass', material: 'glass', unitMassG: 300,
    synonyms: ['glass bottle', 'sauce bottle', 'juice bottle', 'kombucha bottle', 'soda bottle glass'],
    rules: {
      sf: R('recycling', sf('glass-bottles-empty'), { prep: ['Empty it', 'Caps and lids are OK'], cond: ['empty'] }),
      seattle: R('recycling', sea('Glass Bottles or Jars', 'Recycling'), { prep: ['Empty, clean, dry', 'Lids under 3 inches go in the garbage'], cond: ['empty', 'clean', 'min-3in'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Glass Containers)', 'glass bottles'), { prep: ['Empty and rinse', 'Lids off'], cond: ['empty', 'clean', 'lid-off'] }),
    },
  },
  {
    id: 'wine-bottle', name: 'Wine / liquor bottle', category: 'Glass', material: 'glass', unitMassG: 500,
    synonyms: ['wine bottle', 'liquor bottle', 'beer bottle', 'spirits bottle', 'vodka bottle', 'alcohol bottle'],
    rules: {
      sf: R('recycling', sf('wine-bottles'), { prep: ['Empty it', 'Natural corks go in the green bin'], cond: ['empty'] }),
      seattle: R('recycling', sea('Wine Bottle Foil', 'Recycling'), { prep: ['Remove the foil (garbage)'], cond: ['empty'] }),
      toronto: R('special', tor('Deposit Return to Beer Store', 'wine bottles'), { prep: ['Return to The Beer Store for the deposit'] }),
    },
  },
  {
    id: 'glass-jar', name: 'Glass jar', category: 'Glass', material: 'glass', unitMassG: 250,
    synonyms: ['mason jar', 'jam jar', 'pasta sauce jar', 'pickle jar', 'baby food jar', 'jar'],
    rules: {
      sf: R('recycling', sf('glass-jars-empty'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Glass Bottles or Jars', 'Recycling'), { prep: ['Empty, clean, dry', 'Separate the lid'], cond: ['empty', 'clean', 'min-3in'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Glass Containers)', 'glass jars'), { prep: ['Empty and rinse', 'Lids off'], cond: ['empty', 'clean', 'lid-off'] }),
    },
  },
  {
    id: 'drinking-glass', name: 'Drinking glass / Pyrex', category: 'Glass', material: 'none', unitMassG: 250,
    synonyms: ['glass cup', 'wine glass', 'tumbler', 'pyrex', 'glassware', 'window glass'],
    rules: {
      sf: R('garbage', sfp('Glass (window and dishware glass)')),
      seattle: R('garbage', sea('Drinking Glasses', 'Garbage')),
      toronto: R('garbage', tor('Donate (incl. CED) or Garbage (housewares)', 'drinking glass'), { prep: ['Donate if still usable'] }),
    },
  },
  {
    id: 'broken-glass-bottle', name: 'Broken glass bottle or jar', category: 'Glass', material: 'glass', unitMassG: 150,
    synonyms: ['broken bottle', 'broken jar', 'glass shards'],
    rules: {
      seattle: R('recycling', sea('Broken Glass', 'Recycling'), { cond: ['min-3in'], variants: [V('pieces smaller than 3 inches', 'garbage', sea('Broken Glass', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Glass Containers)', 'glass bottles (broken)')),
    },
  },
  {
    id: 'ceramic-dish', name: 'Ceramic mug / plate', category: 'Glass', material: 'none', unitMassG: 400,
    synonyms: ['mug', 'plate', 'bowl', 'dishware', 'porcelain', 'china', 'broken plate'],
    rules: {
      sf: R('garbage', sfp('Broken ceramic dishware and glassware')),
      seattle: R('garbage', sea('Mugs, Plates, or Bowls', 'Garbage'), { prep: ['Donate if still usable'] }),
      toronto: R('garbage', tor('Donate (incl. CED) or Garbage (housewares)', 'ceramic dishes'), { prep: ['Donate if still usable'] }),
    },
  },
  {
    id: 'mirror', name: 'Mirror', category: 'Glass', material: 'none', unitMassG: 2000,
    synonyms: ['broken mirror', 'mirror glass'],
    rules: {
      sf: R('garbage', sfp('Mirrors (if not in condition to be reused)')),
      seattle: R('garbage', sea('Mirrors', 'Garbage'), { prep: ['Must fit in the cart with the lid closed'] }),
      toronto: R('garbage', tor('Garbage (broken, non-BB glass)', 'broken mirror'), { prep: ['Wrap sharp edges first'] }),
    },
  },

  // ───────────────────────── Plastic ─────────────────────────
  {
    id: 'plastic-bottle', name: 'Plastic drink bottle', category: 'Plastic', material: 'pet', unitMassG: 25,
    synonyms: ['water bottle', 'soda bottle', 'pop bottle', 'pet bottle', 'juice bottle', 'plastic bottle'],
    rules: {
      sf: R('recycling', sf('plastic-bottles-empty'), { prep: ['Empty it', 'Leave the cap on'], cond: ['empty', 'caps-on'] }),
      seattle: R('recycling', sea('Plastic Bottles', 'Recycling'), { prep: ['Empty and clean', 'Cap on is OK'], cond: ['empty', 'clean', 'caps-on'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic water bottles'), { prep: ['Empty and rinse', 'Lid on'], cond: ['empty', 'clean', 'lid-on'] }),
    },
  },
  {
    id: 'plastic-jug', name: 'Plastic jug (milk, detergent)', category: 'Plastic', material: 'hdpe', unitMassG: 80,
    synonyms: ['milk jug', 'laundry detergent jug', 'bleach bottle', 'hdpe jug', 'juice jug'],
    rules: {
      sf: R('recycling', sf('plastic-bottles-empty'), { prep: ['Empty it', 'Leave the cap on'], cond: ['empty', 'caps-on'] }),
      seattle: R('recycling', sea('Plastic Jugs', 'Recycling'), { prep: ['Clean, empty, dry', 'Cap attached'], cond: ['empty', 'clean', 'dry', 'caps-on'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic jugs'), { cond: ['empty', 'clean', 'lid-on'] }),
    },
  },
  {
    id: 'shampoo-bottle', name: 'Shampoo / lotion bottle', category: 'Plastic', material: 'hdpe', unitMassG: 40,
    synonyms: ['lotion bottle', 'soap bottle', 'body wash bottle', 'conditioner bottle', 'shampoo'],
    rules: {
      sf: R('recycling', sf('plastic-bottles-empty'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Shampoo, Lotion, and Hair or Skin Care Bottles', 'Recycling'), { prep: ['Clean, empty, dry', 'Pump tops go in the garbage'], cond: ['empty', 'clean', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 1', 'plastic shampoo bottles (empty)'), { cond: ['empty', 'lid-on'] }),
    },
  },
  {
    id: 'plastic-tub', name: 'Yogurt / margarine tub', category: 'Plastic', material: 'pp', unitMassG: 20,
    synonyms: ['yogurt cup', 'yoghurt tub', 'margarine tub', 'deli container', 'sour cream tub', 'cottage cheese tub', 'butter tub'],
    rules: {
      sf: R('recycling', sf('plastic-tubs-lids-empty'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Plastic Tubs', 'Recycling'), { cond: ['empty', 'clean', 'dry'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'yogurt tubs'), { cond: ['empty', 'clean', 'lid-on'] }),
    },
  },
  {
    id: 'plastic-clamshell', name: 'Plastic clamshell / takeout box', category: 'Plastic', material: 'pet', unitMassG: 25,
    synonyms: ['berry container', 'salad container', 'plastic takeout container', 'to-go container', 'clamshell'],
    rules: {
      sf: R('recycling', sf('plastic-clamshells-empty'), { cond: ['empty'] }),
      seattle: R('recycling', sea('To-Go or Take-Out Containers', 'Recycling'), { cond: ['empty', 'clean', 'dry'],
        variants: [V('dirty', 'garbage', sea('To-Go or Take-Out Containers', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'clam shell containers'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'plastic-cup', name: 'Plastic cold-drink cup', category: 'Plastic', material: 'pp', unitMassG: 12,
    synonyms: ['plastic cup', 'iced coffee cup', 'solo cup', 'smoothie cup', 'bubble tea cup'],
    rules: {
      sf: R('recycling', sf('plastic-cups-plates-empty'), { cond: ['empty'] }),
      seattle: R('recycling', sea('Plastic Cups or Utensils', 'Recycling'), { cond: ['empty', 'clean'], variants: [V('dirty', 'garbage', sea('Plastic Cups or Utensils', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic cups'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'coffee-lid', name: 'Plastic coffee-cup lid', category: 'Plastic', material: 'mixed-plastics', unitMassG: 3,
    synonyms: ['cup lid', 'drink lid', 'coffee lid', 'sippy lid'],
    rules: {
      sf: R('recycling', sf('plastic-coffee-cup-lids')),
      seattle: R('recycling', sea('Deli, Coffee, or Soft Drink Lids', 'Recycling'), { cond: ['min-3in'],
        variants: [V('smaller than 3 inches across', 'garbage', sea('Deli, Coffee, or Soft Drink Lids', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic coffee cup lid')),
    },
  },
  {
    id: 'plastic-cutlery', name: 'Plastic cutlery', category: 'Plastic', material: 'mixed-plastics', unitMassG: 3,
    synonyms: ['plastic fork', 'plastic spoon', 'plastic knife', 'utensils', 'disposable cutlery'],
    rules: {
      seattle: R('garbage', sea('Plastic Cups or Utensils', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic cutlery')),
    },
  },
  {
    id: 'plastic-bag', name: 'Plastic grocery bag', category: 'Plastic', material: 'ldpe', unitMassG: 6,
    synonyms: ['shopping bag', 'plastic bag', 'carrier bag', 'produce bag', 'bread bag', 'grocery bag', 'bags'],
    rules: {
      sf: R('special', sf('plastic-bags-plastic-wrap'), { prep: ['Reuse it, or return to a store take-back / drop-off location'] }),
      seattle: R('garbage', sea('Grocery or Shopping Bags', 'Garbage'), { prep: ['Clean bags can go to a participating grocery store drop-off'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'plastic grocery bags'), { prep: ['Empty and free of food residue'], cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'plastic-film', name: 'Plastic wrap / film', category: 'Plastic', material: 'ldpe', unitMassG: 5,
    synonyms: ['cling wrap', 'saran wrap', 'shrink wrap', 'stretch wrap', 'plastic film', 'overwrap', 'cling film'],
    rules: {
      sf: R('special', sf('plastic-bags-plastic-wrap'), { prep: ['Return to a take-back / drop-off location'] }),
      seattle: R('garbage', sea('Plastic - Bags, Wrap and Film', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'plastic food wrap'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'zip-bag', name: 'Zip-top bag (Ziploc)', category: 'Plastic', material: 'ldpe', unitMassG: 5,
    synonyms: ['ziploc', 'ziplock', 'sandwich bag', 'freezer bag', 'resealable bag'],
    rules: {
      sf: R('special', sf('plastic-bags-plastic-wrap'), { verified: false, note: 'Inferred from the SF Recycles “Plastic bags, plastic wrap” page; zip-top bags are not named explicitly.' }),
      seattle: R('garbage', sea('Ziploc Bags', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'Ziploc bags'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'bubble-wrap', name: 'Bubble wrap / air pillows', category: 'Plastic', material: 'ldpe', unitMassG: 15,
    synonyms: ['bubblewrap', 'air pillows', 'packing air cushions', 'inflatable packaging'],
    rules: {
      sf: R('special', sf('plastic-bags-plastic-wrap'), { prep: ['Return to a take-back / drop-off location'] }),
      seattle: R('garbage', sea('Plastic - Bags, Wrap and Film', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'bubble wrap')),
    },
  },
  {
    id: 'plastic-mailer', name: 'Plastic / padded mailer', category: 'Plastic', material: 'ldpe', unitMassG: 20,
    synonyms: ['poly mailer', 'bubble mailer', 'padded envelope', 'shipping bag', 'amazon mailer'],
    rules: {
      seattle: R('garbage', sea('Plastic Mailers, Paper Mailers, and Paper Bubble Wrap Envelopes', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'plastic mailing envelopes')),
    },
  },
  {
    id: 'chip-bag', name: 'Chip bag / candy wrapper', category: 'Plastic', material: 'none', unitMassG: 5,
    synonyms: ['crisp packet', 'potato chip bag', 'snack bag', 'candy wrapper', 'granola bar wrapper', 'mylar', 'chocolate wrapper'],
    rules: {
      sf: R('garbage', sf('shiny-food-wrappers')),
      seattle: R('garbage', sea('Chip Bags', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Paper Laminate Packaging)', 'chip bags'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'stand-up-pouch', name: 'Stand-up pouch', category: 'Plastic', material: 'none', unitMassG: 10,
    synonyms: ['pouch', 'juice pouch', 'capri sun', 'refill pouch', 'oatmeal pouch', 'snack pouch'],
    rules: {
      seattle: R('garbage', sea('Plastic Stand-up Pouches', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', 'stand-up flexible pouch'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'foam-cup', name: 'Foam cup (Styrofoam)', category: 'Plastic', material: 'ps', unitMassG: 3,
    synonyms: ['styrofoam cup', 'polystyrene cup', 'foam coffee cup', 'eps cup'],
    rules: {
      sf: R('garbage', sf('styrofoamtm-cups-polystyrene-foam-cups')),
      seattle: R('garbage', sea('Styrofoam Cups', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Foam Packaging)', 'Styrofoam cups'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'foam-takeout', name: 'Foam takeout container', category: 'Plastic', material: 'ps', unitMassG: 10,
    synonyms: ['styrofoam clamshell', 'foam clamshell', 'foam box', 'styrofoam container'],
    rules: {
      sf: R('garbage', sfp('Polystyrene foam')),
      seattle: R('garbage', sea('To-Go or Take-Out Containers', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Foam Packaging)', 'foam clamshell/takeout container'), { cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'foam-block', name: 'Foam packaging block', category: 'Plastic', material: 'ps', unitMassG: 100,
    synonyms: ['styrofoam block', 'eps foam', 'polystyrene packaging', 'styrofoam packaging'],
    rules: {
      sf: R('special', sf('styrofoamtm-blocks-polystyrene-foam'), { prep: ['Clean blocks only: drop off with Recology'] }),
      seattle: R('garbage', sea('Foam Blocks', 'Garbage'), { prep: ['Never in mixed recycling', 'Free Special Item pickup can recycle Styrofoam blocks'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Foam Packaging)', 'white Styrofoam'), { cond: ['clean'] }),
    },
  },
  {
    id: 'packing-peanuts', name: 'Foam packing peanuts', category: 'Plastic', material: 'ps', unitMassG: 20,
    synonyms: ['styrofoam peanuts', 'foam peanuts', 'loose fill'],
    rules: {
      sf: R('garbage', sf('styrofoamtm-peanuts-polystyrene-foam')),
      seattle: R('garbage', sea('Packing Peanuts', 'Garbage'), { prep: ['Put in a plastic bag and tie it closed'], cond: ['bagged-tied'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Foam Packaging)', 'foam packaging peanuts'), { prep: ['Put in a tied clear plastic bag'], cond: ['bagged-tied'] }),
    },
  },
  {
    id: 'foam-meat-tray', name: 'Foam meat tray', category: 'Plastic', material: 'ps', unitMassG: 8,
    synonyms: ['styrofoam tray', 'meat tray', 'foam produce tray', 'polystyrene tray'],
    rules: {
      sf: R('garbage', sfp('Polystyrene foam')),
      seattle: R('garbage', sea('Meat Trays', 'Garbage'), { variants: [V('brown or tan plant-based tray', 'compost', sea('Meat Trays', 'Foodandyard'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Foam Packaging)', 'foam meat trays'), { prep: ['Remove film wrap and absorbent pad'], cond: ['empty', 'clean'] }),
    },
  },
  {
    id: 'straw', name: 'Plastic straw', category: 'Plastic', material: 'mixed-plastics', unitMassG: 1,
    synonyms: ['straw', 'drinking straw', 'stir stick'],
    rules: {
      seattle: R('garbage', sea('Straws', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Misc)', 'plastic straws')),
    },
  },
  {
    id: 'flower-pot', name: 'Plastic plant pot', category: 'Plastic', material: 'pp', unitMassG: 50,
    synonyms: ['flower pot', 'nursery pot', 'plant tray', 'seedling tray', 'planter'],
    rules: {
      sf: R('recycling', sfp('Flower pots and trays')),
      seattle: R('recycling', sea('Plant Pots', 'Recycling'), { cond: ['empty', 'clean'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic flower pots')),
    },
  },
  {
    id: 'plastic-bucket', name: 'Plastic bucket', category: 'Plastic', material: 'hdpe', unitMassG: 600,
    synonyms: ['pail', 'bucket', 'paint bucket plastic'],
    rules: {
      sf: R('recycling', sf('plastic-bucket'), { prep: ['Wire handle is OK'] }),
      seattle: R('recycling', sea('Buckets and Carts', 'Recycling'), { cond: ['clean'] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic buckets (from packaging)'), { note: 'Toronto lists buckets “from packaging”.' }),
    },
  },
  {
    id: 'plastic-toy', name: 'Rigid plastic toy (no batteries)', category: 'Plastic', material: 'mixed-plastics', unitMassG: 200,
    synonyms: ['toy', 'plastic toy', 'action figure', 'kids toy'],
    rules: {
      sf: R('recycling', sfp('Toys (no electronics, metal, or batteries)')),
      seattle: R('recycling', sea('Toys or Sporting Goods', 'Recycling'), { prep: ['Rigid plastic, 3 feet or less on all sides', 'Remove batteries'] }),
      toronto: R('garbage', tor('Donate or Garbage (miscellaneous w/ battery)', 'plastic toys'), { prep: ['Donate if usable', 'Remove batteries (hazardous waste)'] }),
    },
  },
  {
    id: 'pill-bottle', name: 'Pill / vitamin bottle', category: 'Plastic', material: 'pp', unitMassG: 20,
    synonyms: ['vitamin bottle', 'prescription bottle', 'medicine bottle', 'pill container', 'pill vial'],
    rules: {
      seattle: R('recycling', sea('Medicine Bottles', 'Recycling'), { cond: ['empty', 'min-3in'],
        variants: [V('orange/brown prescription vial, or under 3 inches', 'garbage', sea('Medicine Bottles', 'Garbage'))] }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'plastic pill bottles (empty)'), { cond: ['empty'] }),
    },
  },
  {
    id: 'toothpaste-tube', name: 'Toothpaste tube', category: 'Plastic', material: 'none', unitMassG: 15,
    synonyms: ['toothpaste', 'squeeze tube', 'lotion tube', 'ointment tube', 'cream tube'],
    rules: {
      sf: R('garbage', sf('toothpaste-tubes-cream-ointment-empty')),
      seattle: R('garbage', sea('Plastic Tubes and Plastic Fencing', 'Garbage', 'Some toothpaste tubes pay be labelled "recyclable" but they are not. Please put them in the garbage.')),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 1', 'toothpaste tube'), { cond: ['empty', 'lid-on'] }),
    },
  },
  {
    id: 'coffee-pod', name: 'Coffee pod (K-Cup)', category: 'Plastic', material: 'none', unitMassG: 3,
    synonyms: ['k-cup', 'keurig pod', 'nespresso capsule', 'coffee capsule', 'tassimo disc'],
    rules: {
      seattle: R('garbage', sea('Coffee Pods', 'Garbage'), { note: 'Pods larger than 3 inches may be recycled; most are smaller.' }),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 2', 'coffee pods/capsules/discs (any material)'), { cond: ['empty'] }),
    },
  },
  {
    id: 'blister-pack', name: 'Blister pack', category: 'Plastic', material: 'none', unitMassG: 10,
    synonyms: ['blister packaging', 'pill blister', 'hard plastic packaging', 'battery packaging'],
    rules: {
      seattle: R('garbage', sea('Blister Packages', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Plastic Containers) 1', 'blister packaging')),
    },
  },
  {
    id: 'compostable-cup', name: '“Compostable” plastic cup (PLA)', category: 'Plastic', material: 'none', unitMassG: 10,
    synonyms: ['pla cup', 'compostable plastic', 'bioplastic', 'plant-based plastic', 'compostable cutlery', 'compostable container'],
    rules: {
      sf: R('compost', sf('compostable-cups-plates-bowls-utensils'), { cond: ['labeled-compostable'] }),
      seattle: R('compost', sea('PLA', 'Foodandyard'), { prep: ['Must be food packaging explicitly labeled “#7 PLA” or “Compostable”'], cond: ['labeled-compostable'] }),
      toronto: R('garbage', tor('Garbage (compostable & wooden items)', 'compostable plastic cups/containers')),
    },
  },
  {
    id: 'six-pack-rings', name: 'Flexible 6-pack rings', category: 'Plastic', material: 'ldpe', unitMassG: 5,
    synonyms: ['six pack rings', 'can rings', 'beverage rings', '6-pack carrier'],
    rules: {
      seattle: R('garbage', sea('6-Pack Plastic Carrier', 'Garbage')),
      toronto: R('recycling', tor('NEW Blue Bin (Flexible Plastic Packaging)', '6-pack plastic rings')),
    },
  },

  // ───────────────────────── Food & yard ─────────────────────────
  {
    id: 'food-scraps', name: 'Food scraps', category: 'Organics', material: 'food-waste', unitMassG: 300,
    synonyms: ['leftovers', 'fruit', 'vegetables', 'peels', 'food waste', 'bread', 'rice', 'spoiled food', 'moldy food', 'banana peel', 'apple core'],
    rules: {
      sf: R('compost', sf('food-scraps-spoiled-food')),
      seattle: R('compost', sea('Food Scraps', 'Foodandyard')),
      toronto: R('compost', tor('Green Bin (miscellaneous)', 'food scraps')),
    },
  },
  {
    id: 'meat-bones', name: 'Meat, fish & bones', category: 'Organics', material: 'food-waste', unitMassG: 200,
    synonyms: ['bones', 'chicken bones', 'fish', 'shellfish', 'seafood shells', 'meat', 'shrimp shells'],
    rules: {
      sf: R('compost', sf('meat'), { prep: ['Bones are OK'] }),
      seattle: R('compost', sea('Food Scraps', 'Foodandyard', 'Meat, fish, and chicken')),
      toronto: R('compost', tor('Green Bin (food - meat, fish & seafood)', 'meat (raw and cooked)')),
    },
  },
  {
    id: 'coffee-grounds', name: 'Coffee grounds & paper filter', category: 'Organics', material: 'food-waste', unitMassG: 100,
    synonyms: ['coffee filter', 'coffee grinds', 'espresso grounds'],
    rules: {
      sf: R('compost', sf('coffee-grounds-coffee-filter')),
      seattle: R('compost', sea('Coffee Filters', 'Foodandyard')),
      toronto: R('compost', tor('Green Bin (miscellaneous)', 'coffee grounds')),
    },
  },
  {
    id: 'tea-bag', name: 'Tea bag (paper)', category: 'Organics', material: 'food-waste', unitMassG: 3,
    synonyms: ['teabag', 'tea bags', 'loose tea'],
    rules: {
      sf: R('compost', sf('tea-bags'), { prep: ['Remove staples', 'Plastic tea bags go in landfill'] }),
      seattle: R('compost', sea('Tea Bags', 'Foodandyard'), { prep: ['Remove staples'], variants: [V('plastic mesh bag', 'garbage', sea('Tea Bags', 'Garbage'))] }),
      toronto: R('compost', tor('Green Bin (miscellaneous)', 'paper tea bags'), { variants: [V('nylon or silk bag', 'garbage', tor('Green Bin (non-paper tea bags)', 'nylon tea bags'))] }),
    },
  },
  {
    id: 'eggshells', name: 'Eggshells', category: 'Organics', material: 'food-waste', unitMassG: 20,
    synonyms: ['egg shells', 'eggs', 'nutshells'],
    rules: {
      sf: R('compost', sf('eggshells')),
      seattle: R('compost', sea('Food Scraps', 'Foodandyard', 'Eggshells and nutshells')),
      toronto: R('compost', tor('Green Bin (miscellaneous)', 'eggshell')),
    },
  },
  {
    id: 'yard-waste', name: 'Leaves & yard trimmings', category: 'Organics', material: 'mixed-organics', unitMassG: 1000,
    synonyms: ['leaves', 'grass clippings', 'weeds', 'branches', 'garden waste', 'yard waste'],
    rules: {
      sf: R('compost', sf('leaves')),
      seattle: R('compost', sea('Leaves, seeds, or Non-Woody Yard Waste', 'Foodandyard')),
      toronto: R('special', tor('Yard Waste 1', 'leaves'), { prep: ['Separate yard-waste collection: kraft paper bag or rigid open-top container', 'Not in plastic bags or boxes'] }),
    },
  },
  {
    id: 'cooking-oil', name: 'Cooking grease (small amount)', category: 'Organics', material: 'none', unitMassG: 100,
    synonyms: ['grease', 'bacon fat', 'frying oil', 'vegetable oil', 'cooking oil', 'fat'],
    rules: {
      sf: R('compost', sfp('Cooking grease: Small amounts can be soaked up with a paper towel and composted.'), { prep: ['Soak up with a paper towel'] }),
      seattle: R('compost', sea('Fats, Cooking Oils, Grease', 'Foodandyard'), { prep: ['Wipe up with paper towel or newspaper'], note: 'Liquid oil (up to 2 gallons) can be set out next to the recycling cart in labeled 1-gallon jugs.' }),
      toronto: R('compost', tor('Green Bin - cooking oil (small amount)', 'cooking oil/grease (small amount)'), { prep: ['Let it harden or soak it into a paper towel', 'Never pour down the drain'] }),
    },
  },
  {
    id: 'wood-chopsticks', name: 'Wooden chopsticks / stir sticks', category: 'Organics', material: 'none', unitMassG: 5,
    synonyms: ['chopsticks', 'popsicle stick', 'coffee stirrer', 'toothpick', 'wooden skewer'],
    rules: {
      sf: R('compost', sf('wood-chopsticks-coffee-stirrers-toothpicks')),
      seattle: R('compost', sea('Chopsticks', 'Foodandyard')),
      toronto: R('garbage', tor('Garbage (food/drink-related)', 'chopsticks')),
    },
  },
  {
    id: 'cork', name: 'Wine cork (natural)', category: 'Organics', material: 'none', unitMassG: 4,
    synonyms: ['cork', 'wine cork', 'bottle cork'],
    rules: {
      sf: R('compost', sf('corks-natural')),
      seattle: R('garbage', sea('Corks', 'Garbage'), { prep: ['ReCORK drop-off locations recycle corks'] }),
      toronto: R('garbage', tor('Garbage (miscellaneous 1)', 'wine corks (natural and synthetic/plastic)')),
    },
  },
  {
    id: 'compostable-bag', name: 'Certified compostable bag', category: 'Organics', material: 'none', unitMassG: 10,
    synonyms: ['bpi bag', 'compost bin liner', 'biobag', 'compostable bag'],
    rules: {
      sf: R('compost', sf('compostable-bags'), { cond: ['labeled-compostable'] }),
      seattle: R('compost', sea('Compostable Bags', 'Foodandyard'), { cond: ['labeled-compostable'] }),
    },
  },

  // ───────────────────────── Hygiene ─────────────────────────
  {
    id: 'diaper', name: 'Disposable diaper', category: 'Hygiene', material: 'none', unitMassG: 200,
    synonyms: ['nappy', 'pampers', 'huggies', 'diapers', 'pull-ups'],
    rules: {
      sf: R('garbage', sfp('Diapers')),
      seattle: R('garbage', sea('Disposable Diapers', 'Garbage'), { prep: ['Bag and tie off'] }),
      toronto: R('compost', tor('Green Bin (baby diapers, w/ wipes)', 'disposable diapers'), { prep: ['Wipes go in the garbage'] }),
    },
  },
  {
    id: 'pet-waste', name: 'Dog / cat poop', category: 'Hygiene', material: 'none', unitMassG: 100,
    synonyms: ['dog poop', 'cat poop', 'pet waste', 'poo bag', 'dog waste'],
    rules: {
      sf: R('garbage', sf('dog-or-cat-poop-kitty-litter')),
      seattle: R('garbage', sea('Pet Waste, Litter and Feces', 'Garbage'), { prep: ['Bag it and tie it off'] }),
      toronto: R('compost', tor('Green Bin (pet waste)', 'dog poop'), { prep: ['Any bag type is fine (bags are removed at processing)'] }),
    },
  },
  {
    id: 'kitty-litter', name: 'Cat litter (clay)', category: 'Hygiene', material: 'none', unitMassG: 1000,
    synonyms: ['kitty litter', 'cat litter', 'clay litter', 'used litter'],
    rules: {
      sf: R('garbage', sf('dog-or-cat-poop-kitty-litter')),
      seattle: R('garbage', sea('Pet Waste, Litter and Feces', 'Garbage')),
      toronto: R('compost', tor('Green Bin (pets excl waste)', 'clay kitty litter'), {
        variants: [V('crystal / silica litter', 'garbage', tor('Garbage (pet-related)', 'crystal kitty litter'))] }),
    },
  },
  {
    id: 'menstrual-pad', name: 'Menstrual pad', category: 'Hygiene', material: 'none', unitMassG: 10,
    synonyms: ['sanitary pad', 'maxi pad', 'panty liner', 'period pad'],
    rules: {
      sf: R('garbage', sfp('Menstrual/sanitary products')),
      seattle: R('garbage', sea('Menstrual Hygiene Products', 'Garbage')),
      toronto: R('compost', tor('Green Bin - menstrual products excl tampons', 'maxi pads')),
    },
  },
  {
    id: 'wipes', name: 'Wet wipes', category: 'Hygiene', material: 'none', unitMassG: 5,
    synonyms: ['baby wipes', 'flushable wipes', 'cleaning wipes', 'makeup wipes', 'wet wipe'],
    rules: {
      seattle: R('garbage', sea('Flushable Wipes', 'Garbage'), { prep: ['Never flush, even if labeled “flushable”'] }),
      toronto: R('garbage', tor('Garbage (wipes)', 'wet wipes'), { prep: ['Bag them'] }),
    },
  },
  {
    id: 'cotton-swab', name: 'Cotton swab / cotton ball', category: 'Hygiene', material: 'none', unitMassG: 1,
    synonyms: ['q-tip', 'cotton bud', 'cotton ball', 'ear swab'],
    rules: {
      sf: R('compost', sf('cotton-balls-swabs'), { prep: ['Paper stems only, no plastic'] }),
      seattle: R('garbage', sea('Cotton Swabs and Cotton Balls', 'Garbage')),
      toronto: R('garbage', tor('Garbage (toiletries) 2', 'cotton swabs')),
    },
  },
  {
    id: 'face-mask', name: 'Disposable face mask / gloves', category: 'Hygiene', material: 'none', unitMassG: 4,
    synonyms: ['disposable mask', 'surgical mask', 'ppe', 'latex gloves', 'n95'],
    rules: {
      sf: R('garbage', sf('disposable-masks')),
      seattle: R('garbage', sea('Medical Equipment and Personal Protective Equipment (PPE)', 'Garbage'), { prep: ['Cut the ear loops'] }),
      toronto: R('garbage', tor('Garbage (PPE) - bagged', 'disposable face masks'), { prep: ['Bag them (not loose)'] }),
    },
  },

  // ───────────────────────── Hazardous, electronics & special ─────────────────────────
  {
    id: 'battery', name: 'Household batteries', category: 'Hazardous', material: 'hazardous', unitMassG: 25,
    synonyms: ['aa battery', 'aaa battery', 'battery', 'batteries', '9v', 'lithium battery', 'button cell', 'rechargeable battery'],
    rules: {
      sf: R('special', sf('household-batteries'), { prep: ['Tape the contacts of lithium batteries', 'Houses: clear plastic bag on top of the black bin'] }),
      seattle: R('special', sea('Household Batteries', 'General', 'Batteries are NOT allowed in the garbage'), { prep: ['Drop off free at a transfer station', 'Tape each end'] }),
      toronto: R('special', tor('HHW (batteries, incl prep)', 'household battery/batteries'), { prep: ['Tape the positive terminal', 'Drop-Off Depot or Community Environment Day'] }),
    },
  },
  {
    id: 'cfl-bulb', name: 'Fluorescent bulb (CFL / tube)', category: 'Hazardous', material: 'hazardous', unitMassG: 100,
    synonyms: ['cfl', 'fluorescent tube', 'compact fluorescent', 'fluorescent light'],
    rules: {
      sf: R('special', sf('light-bulbs-cfls-and-tubes')),
      seattle: R('special', sea('Light Bulbs', 'Hazardous')),
      toronto: R('special', tor('HHW (CFL, fluorescent lights, excl tubes)', 'compact fluorescent lights (CFL)')),
    },
  },
  {
    id: 'led-bulb', name: 'LED light bulb', category: 'Hazardous', material: 'none', unitMassG: 60,
    synonyms: ['led bulb', 'led lamp', 'led light'],
    rules: {
      sf: R('special', sf('light-bulbs-led')),
      seattle: R('garbage', sea('Light Bulbs', 'Garbage')),
      toronto: R('special', tor('HHW (light bulbs)', 'LED (light-emitting diode) light bulbs')),
    },
  },
  {
    id: 'incandescent-bulb', name: 'Incandescent / halogen bulb', category: 'Hazardous', material: 'none', unitMassG: 30,
    synonyms: ['light bulb', 'halogen bulb', 'incandescent bulb', 'old light bulb'],
    rules: {
      sf: R('garbage', sfp('Light bulbs: incandescent only.')),
      seattle: R('garbage', sea('Light Bulbs', 'Garbage')),
      toronto: R('special', tor('HHW (light bulbs)', 'incandescent light bulbs')),
    },
  },
  {
    id: 'electronics', name: 'Phone, laptop & small electronics', category: 'Hazardous', material: 'e-waste', unitMassG: 200,
    synonyms: ['smartphone', 'cell phone', 'iphone', 'tablet', 'laptop', 'earbuds', 'e-waste', 'electronics', 'power bank'],
    rules: {
      sf: R('special', sf('battery-embedded-products')),
      seattle: R('special', sea('Cell Phones and Batteries', 'Hazardous')),
      toronto: R('special', tor('Electronic Waste (small)', 'cell phones'), { prep: ['Clear bag or open box, 0.5 m from the garbage bin on garbage day', 'Or a Drop-Off Depot'] }),
    },
  },
  {
    id: 'cables', name: 'Cords & charging cables', category: 'Hazardous', material: 'none', unitMassG: 100,
    synonyms: ['charging cable', 'charger', 'usb cable', 'phone charger', 'power cord'],
    rules: {
      seattle: R('garbage', sea('Wire, Cables, or Cords', 'Garbage'), { prep: ['Electronics recyclers accept cords for metal recovery'] }),
      toronto: R('special', tor('Electronic Waste (small)', 'electronic cables/chargers'), { prep: ['Set out as electronic waste next to the garbage bin'] }),
    },
  },
  {
    id: 'vape', name: 'Vape / e-cigarette', category: 'Hazardous', material: 'hazardous', unitMassG: 30,
    synonyms: ['e-cigarette', 'vape pen', 'vaping device', 'disposable vape', 'e-cig'],
    rules: {
      sf: R('special', sf('vapes')),
      seattle: R('special', sea('E-cigarettes, Vaping Devices, and Cigarettes', 'Hazardous')),
      toronto: R('special', tor('HHW (with non-removable batteries)', 'vapes/vaporizers (with non-removable batteries)')),
    },
  },
  {
    id: 'paint', name: 'Leftover paint', category: 'Hazardous', material: 'hazardous', unitMassG: 2000,
    synonyms: ['latex paint', 'oil paint', 'stain', 'varnish', 'house paint'],
    rules: {
      sf: R('special', sf('house-paint')),
      seattle: R('special', sea('Paint, Paint Thinner, and Paint Cans', 'Dropoff')),
      toronto: R('special', tor('HHW (paint - Product Care)', 'latex paints')),
    },
  },
  {
    id: 'propane-canister', name: 'Small propane / butane canister', category: 'Hazardous', material: 'hazardous', unitMassG: 400,
    synonyms: ['propane', 'butane', 'camping gas', '1 lb propane', 'coleman canister', 'camp stove fuel'],
    rules: {
      sf: R('special', sf('empty-one-pound-disposable-propane-or-butane-gas-cylinder')),
      seattle: R('garbage', sea('Small Gas Canisters', 'Garbage'), { cond: ['empty'], note: 'Never in recycling: explosion hazard at the sorting facility.',
        variants: [V('contains any gas', 'special', sea('Small Gas Canisters', 'Hazardous'))] }),
      toronto: R('special', tor('HHW (Orange Drop - containers, even if empty)', 'propane tanks/cylinders')),
    },
  },
  {
    id: 'medicine', name: 'Medicine & pills', category: 'Hazardous', material: 'hazardous', unitMassG: 50,
    synonyms: ['pills', 'prescription drugs', 'medication', 'medicines', 'tablets'],
    rules: {
      sf: R('special', sf('medicine')),
      seattle: R('special', sea('Medicines', 'Dropoff')),
      toronto: R('special', tor('HHW (medications/vitamins/etc.)', 'medications')),
    },
  },
  {
    id: 'sharps', name: 'Needles & syringes', category: 'Hazardous', material: 'hazardous', unitMassG: 20,
    synonyms: ['needles', 'syringes', 'lancets', 'epipen', 'insulin pen', 'sharps'],
    rules: {
      sf: R('special', sf('syringes-needles')),
      seattle: R('special', sea('Sharps', 'Dropoff')),
      toronto: R('special', tor('HHW (sharps) 1', 'syringes')),
    },
  },
  {
    id: 'clothing', name: 'Clothing & shoes', category: 'Other', material: 'none', unitMassG: 500,
    synonyms: ['clothes', 'shirt', 'jeans', 'shoes', 'textiles', 'fabric', 'jacket'],
    rules: {
      sf: R('reuse', sf('clothes-usable')),
      seattle: R('reuse', sea('Clothes or Shoes', 'Donate'), { variants: [V('worn out or damaged', 'special', sea('Clothes or Shoes', 'Dropoff'))] }),
      toronto: R('reuse', tor('Donate (incl. CED) or Garbage (clothing, accessories etc.)', 'clothing'), { variants: [V('not reusable', 'garbage', tor('Donate (incl. CED) or Garbage (clothing, accessories etc.)', 'clothing'))] }),
    },
  },
  {
    id: 'garden-hose', name: 'Garden hose', category: 'Other', material: 'none', unitMassG: 1500,
    synonyms: ['hose', 'rubber hose', 'water hose'],
    rules: {
      seattle: R('garbage', sea('Garden Hoses', 'Garbage'), { prep: ['Cut it to fit in the cart'] }),
      toronto: R('garbage', tor('Garbage (outdoor)', 'garden hose')),
    },
  },
  {
    id: 'cd-dvd', name: 'CD / DVD', category: 'Other', material: 'none', unitMassG: 15,
    synonyms: ['cd', 'dvd', 'compact disc', 'blu-ray', 'disc'],
    rules: {
      sf: R('reuse', sf('cds-dvds-working')),
      seattle: R('garbage', sea('CDs, DVDs, Records, Video Tapes, and Floppy Disks', 'Garbage'), { prep: ['Donate if still working'] }),
      toronto: R('garbage', tor('Donate (incl. CED) or Garbage (discs, tapes)', 'DVDs'), { prep: ['Donate if still working'] }),
    },
  },
];

/** City-wide rules that apply to every recyclable (bagging, cleanliness). */
export const general = {
  sf: [
    { id: 'loose', text: 'Recyclables go in loose, empty, clean and dry.', src: { doc: 'sf-recology', q: 'Recyclable materials should be loose and remain empty, clean, and dry when placed in the bin to avoid contaminating other materials.' } },
  ],
  seattle: [
    { id: 'clean', text: 'All recycling must be empty, clean and dry.', src: { doc: 'sea-howto', q: 'All recycling must be empty, clean, and dry to be ready for recycling. No foods or liquids, because they ruin other recyclables.' } },
    { id: 'loose', text: 'Put recyclables loose in the cart: never bagged or boxed.', src: { doc: 'sea-process', q: 'Be sure to put materials loose in the cart: do not bag or box recyclables.' } },
    { id: 'min-3in', text: 'Items must be bigger than 3 inches.', src: { doc: 'sea-howto', q: 'Items need to be bigger than 3 inches.' } },
  ],
  toronto: [
    { id: 'clean', text: 'Containers must be empty and free from food residue.', src: { doc: 'tor-ww', key: 'NEW Blue Bin (Metal)', q: 'Empty and free from food residue.' } },
  ],
};
