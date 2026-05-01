const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found at:', serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

const herbs = [
  {
    id: 'moringa',
    name: 'Moringa',
    scientificName: 'Moringa oleifera',
    category: 'nutrition',
    origin: 'West Africa, India',
    partsUsed: 'Leaves, seeds, pods, roots',
    description: 'Known as the "Miracle Tree", moringa is a nutrient-dense superfood packed with vitamins, minerals, and antioxidants.',
    longDescription: 'Moringa oleifera is a fast-growing, drought-resistant tree native to the Indian subcontinent and widely cultivated across tropical Africa. It contains 7 times more vitamin C than oranges, 10 times more vitamin A than carrots, 17 times more calcium than milk, and 9 times more protein than yogurt. African traditional healers have used moringa for centuries to treat malnutrition, inflammation, and infections.',
    benefits: [
      'Boosts immune system and energy levels',
      'Rich in antioxidants that fight free radicals',
      'Supports healthy blood sugar levels',
      'Reduces inflammation throughout the body',
      'Improves digestive health and regularity',
      'Supports lactation in nursing mothers',
      'Promotes healthy skin and hair'
    ],
    medicinalUses: [
      'Malnutrition and vitamin deficiencies',
      'Type 2 diabetes management',
      'Arthritis and joint inflammation',
      'High blood pressure',
      'Anemia (rich in iron)',
      'Stomach ulcers and digestive issues',
      'Bacterial and fungal infections'
    ],
    preparation: 'Steep 1-2 teaspoons of dried moringa leaves in hot water for 5-10 minutes to make tea. Fresh leaves can be added to soups, stews, and smoothies. Leaf powder can be sprinkled on food or mixed into drinks.',
    dosage: '1-2 teaspoons of leaf powder daily, or 1 cup of tea 2-3 times per day. Start with small amounts and gradually increase.',
    warnings: [
      'May lower blood sugar - diabetics should monitor levels closely',
      'Avoid consuming large amounts of bark or root (contains toxic compounds)',
      'Pregnant women should consult a practitioner before use',
      'May interfere with blood-thinning medications'
    ],
    rating: 4.8,
    images: [],
    isPublished: true,
  },
  {
    id: 'neem',
    name: 'Neem',
    scientificName: 'Azadirachta indica',
    category: 'skin-care',
    origin: 'West Africa, India',
    partsUsed: 'Leaves, bark, seeds, oil',
    description: 'Neem is a powerful medicinal tree known as the "village pharmacy" in West Africa and India. It has potent antibacterial, antiviral, and antifungal properties.',
    longDescription: 'Neem has been used in African traditional medicine for over 4,500 years. Every part of the tree is medicinal. The leaves are used to treat skin conditions, the bark for fever, and the oil for hair and skin care. It is particularly effective against malaria, skin infections, and dental problems.',
    benefits: [
      'Powerful antibacterial and antifungal properties',
      'Supports healthy skin and clears acne',
      'Boosts immune system function',
      'Promotes dental health and fresh breath',
      'Supports liver detoxification',
      'Natural insect repellent',
      'Helps control blood sugar levels'
    ],
    medicinalUses: [
      'Skin infections, eczema, and psoriasis',
      'Malaria and fever management',
      'Dental plaque and gingivitis',
      'Head lice and scabies',
      'Stomach worms and parasites',
      'Diabetes management',
      'Acne and skin blemishes'
    ],
    preparation: 'Boil a handful of fresh neem leaves in 4 cups of water for 10 minutes. Strain and drink 1 cup twice daily. For skin, make a paste with crushed leaves and water, apply to affected areas for 20 minutes.',
    dosage: '1 cup of neem tea twice daily. For skin paste, apply once daily. Neem oil: 2-3 drops mixed with carrier oil for topical use.',
    warnings: [
      'Not recommended during pregnancy or breastfeeding',
      'May cause liver damage in very high doses',
      'Can lower blood sugar significantly',
      'May reduce fertility in men if taken long-term'
    ],
    rating: 4.6,
    images: [],
    isPublished: true,
  },
  {
    id: 'bitter-leaf',
    name: 'Bitter Leaf',
    scientificName: 'Vernonia amygdalina',
    category: 'digestion',
    origin: 'West Africa (Nigeria, Ghana)',
    partsUsed: 'Leaves',
    description: 'Bitter Leaf, known as Onugbu in Igbo, is a staple in West African traditional medicine. Despite its bitter taste, it is one of the most powerful herbs for digestive and metabolic health.',
    longDescription: 'Vernonia amygdalina is a shrub that grows throughout tropical Africa. In Nigerian traditional medicine, it is used to treat over 20 different ailments. The bitterness stimulates digestive enzymes and bile production. Modern research confirms its effectiveness against diabetes, malaria, and certain cancers.',
    benefits: [
      'Regulates blood sugar and supports diabetes management',
      'Detoxifies the liver and kidneys',
      'Stimulates appetite and improves digestion',
      'Rich in antioxidants and anti-inflammatory compounds',
      'Supports weight management',
      'Boosts immune response to infections',
      'May have anti-cancer properties'
    ],
    medicinalUses: [
      'Type 2 diabetes and high blood sugar',
      'Stomachaches, constipation, and indigestion',
      'Malaria and fever',
      'High blood pressure',
      'Skin infections and wounds',
      'Respiratory infections',
      'Prostate enlargement symptoms'
    ],
    preparation: 'Wash fresh leaves thoroughly. Boil 10-15 leaves in 3 cups of water for 15 minutes. Strain and drink 1 cup twice daily. The bitterness reduces with boiling. Can also be squeezed raw and the juice extracted.',
    dosage: '1 cup of bitter leaf tea, twice daily before meals. For juice: 2-3 tablespoons of fresh extract daily.',
    warnings: [
      'Very bitter taste may cause nausea initially',
      'May lower blood sugar too much if combined with diabetes medication',
      'Pregnant women should use only under practitioner guidance',
      'Excessive consumption may cause stomach upset'
    ],
    rating: 4.7,
    images: [],
    isPublished: true,
  },
  {
    id: 'scent-leaf',
    name: 'Scent Leaf',
    scientificName: 'Ocimum gratissimum',
    category: 'respiratory',
    origin: 'West Africa (Nigeria, Ghana)',
    partsUsed: 'Leaves, stems',
    description: 'Scent Leaf, called Efirin (Yoruba) or Nchanwu (Igbo), is an aromatic herb used extensively in African cooking and traditional medicine for respiratory and digestive issues.',
    longDescription: 'Ocimum gratissimum is a highly aromatic species of basil native to Africa and Southeast Asia. In West Africa, it is a cornerstone of both cuisine and medicine. The essential oils contain eugenol, thymol, and geraniol, giving it powerful antimicrobial and anti-inflammatory properties. It is often the first herb mothers reach for when a child has a cough or fever.',
    benefits: [
      'Relieves cough, cold, and respiratory congestion',
      'Aids digestion and reduces bloating',
      'Natural antibiotic and antiseptic properties',
      'Repels mosquitoes and insects',
      'Supports oral health and fresh breath',
      'May help lower blood sugar',
      'Calms the nervous system and reduces stress'
    ],
    medicinalUses: [
      'Cough, bronchitis, and chest congestion',
      'Stomachaches and indigestion',
      'Malaria and fever management',
      'Diarrhea and dysentery',
      'Mouth ulcers and toothaches',
      'Skin rashes and insect bites',
      'Menstrual pain relief'
    ],
    preparation: 'For tea: steep a handful of fresh leaves in hot water for 5-7 minutes. For respiratory relief: inhale steam from boiling leaves. For skin: crush leaves and apply as poultice.',
    dosage: '1-2 cups of tea daily. Steam inhalation: 10 minutes, twice daily. Poultice: apply fresh crushed leaves for 30 minutes.',
    warnings: [
      'May slow blood clotting - avoid before surgery',
      'Can lower blood pressure',
      'Pregnant women should use in moderation',
      'May interact with diabetes medications'
    ],
    rating: 4.5,
    images: [],
    isPublished: true,
  },
  {
    id: 'ginger',
    name: 'Ginger',
    scientificName: 'Zingiber officinale',
    category: 'digestion',
    origin: 'West Africa, Southeast Asia',
    partsUsed: 'Rhizome (root)',
    description: 'Ginger is one of the most widely used medicinal spices in Africa. Its warming properties make it essential for digestive issues, nausea, and inflammation.',
    longDescription: 'Ginger has been cultivated in Africa for over 2,000 years, particularly in Nigeria, Sierra Leone, and Ghana. The active compounds gingerol and shogaol give it powerful anti-inflammatory and antioxidant effects. African traditional healers use it for everything from morning sickness to arthritis pain.',
    benefits: [
      'Relieves nausea, motion sickness, and morning sickness',
      'Reduces muscle pain and soreness',
      'Powerful anti-inflammatory for arthritis',
      'Lowers blood sugar and improves heart health',
      'Aids digestion and reduces bloating',
      'Boosts immune system against colds',
      'May reduce menstrual pain'
    ],
    medicinalUses: [
      'Nausea and vomiting (including chemotherapy)',
      'Osteoarthritis and joint pain',
      'Indigestion and delayed stomach emptying',
      'High cholesterol and blood sugar',
      'Menstrual cramps',
      'Migraine headaches',
      'Respiratory infections'
    ],
    preparation: 'Peel and slice fresh ginger root. Boil 5-6 slices in 2 cups of water for 10 minutes. Add honey and lemon to taste. Can also be grated into foods, smoothies, or chewed raw.',
    dosage: '1-2 cups of ginger tea daily. For nausea: chew a small piece of fresh root. Maximum 4 grams of ginger per day.',
    warnings: [
      'May increase bleeding risk - avoid with blood thinners',
      'Can cause heartburn in high doses',
      'Gallstone patients should consult a doctor first',
      'May lower blood sugar too much with diabetes meds'
    ],
    rating: 4.9,
    images: [],
    isPublished: true,
  },
  {
    id: 'hibiscus',
    name: 'Hibiscus (Zobo)',
    scientificName: 'Hibiscus sabdariffa',
    category: 'hypertension',
    origin: 'West Africa, Sudan, Egypt',
    partsUsed: 'Calyces (flower petals)',
    description: 'Hibiscus tea, known as Zobo in Nigeria, Sobolo in Ghana, and Karkade in Sudan, is a deep red herbal tea famous for lowering blood pressure and supporting heart health.',
    longDescription: 'Hibiscus sabdariffa has been consumed across Africa for centuries as both a refreshing beverage and medicine. Clinical studies have shown that drinking hibiscus tea can lower systolic blood pressure by up to 7 points. It is rich in anthocyanins, which give it the distinctive red color and powerful antioxidant properties.',
    benefits: [
      'Significantly lowers high blood pressure',
      'Reduces LDL cholesterol levels',
      'Supports liver health and detoxification',
      'Rich in vitamin C and antioxidants',
      'Promotes weight loss and metabolism',
      'Has mild diuretic properties',
      'Supports immune function'
    ],
    medicinalUses: [
      'Hypertension (high blood pressure)',
      'High cholesterol',
      'Liver conditions and fatty liver',
      'Fever and heat stroke',
      'Constipation',
      'Anxiety and restlessness',
      'Menstrual cramps'
    ],
    preparation: 'Boil 1 cup of dried hibiscus calyces in 4 cups of water for 10 minutes. Strain and sweeten with honey or pineapple juice. Serve hot or chilled. Add ginger and cloves for extra flavor and benefits.',
    dosage: '1-2 cups daily. For blood pressure: drink 1 cup in the morning and 1 in the evening consistently.',
    warnings: [
      'Can lower blood pressure significantly - monitor if on medication',
      'May interact with hydroxychloroquine and malaria drugs',
      'Pregnant women should avoid - may stimulate menstruation',
      'Can cause drowsiness - avoid before driving'
    ],
    rating: 4.7,
    images: [],
    isPublished: true,
  },
  {
    id: 'aloe-vera',
    name: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    category: 'skin-care',
    origin: 'North Africa, Madagascar',
    partsUsed: 'Gel (inner leaf), latex (under skin)',
    description: 'Aloe Vera is a succulent plant that has been called the "plant of immortality" by Egyptians. Its gel is used worldwide for burns, skin conditions, and digestive health.',
    longDescription: 'Native to North Africa and the Arabian Peninsula, Aloe Vera has spread throughout the continent. The clear gel inside the leaves contains over 75 active compounds including vitamins, minerals, enzymes, and amino acids. African traditional healers use it for wound healing, skin hydration, and treating constipation.',
    benefits: [
      'Accelerates wound and burn healing',
      'Deeply hydrates and soothes skin',
      'Reduces dental plaque and gum inflammation',
      'Relieves constipation (latex)',
      'Lowers blood sugar levels',
      'Rich in antioxidants and vitamins',
      'Supports digestive health'
    ],
    medicinalUses: [
      'Sunburn, cuts, and minor wounds',
      'Eczema, psoriasis, and acne',
      'Constipation (latex only)',
      'Type 2 diabetes support',
      'Oral ulcers and gum disease',
      'Dry skin and anti-aging',
      'Radiation-induced skin reactions'
    ],
    preparation: 'For skin: cut leaf lengthwise and apply fresh gel directly. For digestion: mix 2 tablespoons of pure gel in water or juice. For constipation: 1 teaspoon of dried latex (use sparingly).',
    dosage: 'Topical: apply as needed. Internal gel: 2 tablespoons daily. Latex: maximum 1 teaspoon, occasional use only.',
    warnings: [
      'Latex (yellow under skin) is a strong laxative - do not overuse',
      'Pregnant and breastfeeding women should avoid internal use',
      'May interact with diabetes and heart medications',
      'Some people are allergic - patch test first'
    ],
    rating: 4.6,
    images: [],
    isPublished: true,
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    category: 'pain-relief',
    origin: 'East Africa, India',
    partsUsed: 'Rhizome (root)',
    description: 'Turmeric is a golden spice revered in African and Indian medicine for its powerful anti-inflammatory compound curcumin. It is used for joint pain, digestion, and overall wellness.',
    longDescription: 'While often associated with India, turmeric has been grown in East Africa for centuries, particularly in Madagascar and coastal regions. Curcumin, its active compound, is one of the most studied natural anti-inflammatories. African healers combine it with black pepper to increase absorption.',
    benefits: [
      'Powerful anti-inflammatory for arthritis and joint pain',
      'Strong antioxidant that neutralizes free radicals',
      'Supports brain function and may prevent dementia',
      'Reduces risk of heart disease',
      'May help prevent and treat cancer',
      'Alleviates symptoms of depression',
      'Supports healthy digestion'
    ],
    medicinalUses: [
      'Osteoarthritis and rheumatoid arthritis',
      'Chronic inflammation and pain',
      'Digestive disorders and IBS',
      'High cholesterol',
      'Skin conditions and wounds',
      'Memory loss and cognitive decline',
      'Post-surgery recovery'
    ],
    preparation: 'Mix 1 teaspoon turmeric powder with warm milk (golden milk), add black pepper and honey. For cooking: add to rice, stews, and soups. For paste: mix powder with water or oil for topical application.',
    dosage: '500-2000mg of turmeric extract daily, or 1-3 teaspoons of powder. Always take with black pepper (piperine) and fat for absorption.',
    warnings: [
      'High doses may cause digestive upset',
      'May increase bleeding risk - stop before surgery',
      'Can worsen gallbladder problems',
      'May interact with blood thinners and diabetes medications'
    ],
    rating: 4.8,
    images: [],
    isPublished: true,
  },
  {
    id: 'baobab',
    name: 'Baobab',
    scientificName: 'Adansonia digitata',
    category: 'nutrition',
    origin: 'Sub-Saharan Africa (The Tree of Life)',
    partsUsed: 'Fruit pulp, leaves, bark, seeds',
    description: 'The Baobab tree is called the "Tree of Life" in Africa. Its fruit has 6 times more vitamin C than oranges and more antioxidants than acai berries.',
    longDescription: 'Baobab trees can live for over 1,000 years and are found across the African savanna. The fruit pulp naturally dehydrates inside the hard shell, creating a powder that is 50% fiber and packed with vitamin C, calcium, potassium, and magnesium. It has been a vital survival food during droughts for millennia.',
    benefits: [
      'Extremely high in vitamin C for immune support',
      'Excellent source of dietary fiber for digestion',
      'High calcium content supports bone health',
      'Prebiotic fiber feeds healthy gut bacteria',
      'Natural energy booster without caffeine',
      'Supports healthy blood sugar levels',
      'Powerful antioxidant for anti-aging'
    ],
    medicinalUses: [
      'Vitamin C deficiency and immune weakness',
      'Constipation and digestive issues',
      'High blood sugar',
      'Fatigue and low energy',
      'Skin aging and damage',
      'Bone density loss',
      'Dehydration and electrolyte imbalance'
    ],
    preparation: 'Mix 1-2 teaspoons of baobab powder into smoothies, yogurt, oatmeal, or water. The powder has a pleasant tangy, citrus-like flavor. Can also be sprinkled on fruit salads.',
    dosage: '1-2 teaspoons of powder daily (approximately 5-10 grams).',
    warnings: [
      'Very high fiber content may cause bloating initially - start small',
      'May lower blood sugar - monitor if diabetic',
      'Pregnant women should consult practitioner (high vitamin C)',
      'Ensure adequate water intake when consuming'
    ],
    rating: 4.7,
    images: [],
    isPublished: true,
  },
  {
    id: 'black-seed',
    name: 'Black Seed',
    scientificName: 'Nigella sativa',
    category: 'immunity',
    origin: 'North Africa, Middle East',
    partsUsed: 'Seeds, seed oil',
    description: 'Black Seed, known as Habbatu Sauda, has been called a "cure for everything but death" in African and Islamic traditional medicine. It is incredibly potent for immune support.',
    longDescription: 'Nigella sativa has been used across North and West Africa for over 2,000 years. The prophet Muhammad reportedly said it cures every disease except death. Modern research confirms thymoquinone, its active compound, has powerful anti-inflammatory, antioxidant, and anti-cancer properties.',
    benefits: [
      'Boosts immune system and fights infections',
      'Powerful anti-inflammatory for asthma and allergies',
      'Supports healthy skin and hair growth',
      'May protect against certain cancers',
      'Supports liver and kidney function',
      'Helps regulate blood sugar and cholesterol',
      'Improves memory and cognitive function'
    ],
    medicinalUses: [
      'Asthma and respiratory allergies',
      'Eczema, psoriasis, and acne',
      'High blood pressure',
      'Type 2 diabetes',
      'Rheumatoid arthritis',
      'Indigestion and bloating',
      'Headaches and migraines'
    ],
    preparation: 'Grind seeds and mix with honey (1 teaspoon seeds + 1 tablespoon honey), take daily. For tea: steep 1 teaspoon crushed seeds in hot water for 10 minutes. Oil: 1 teaspoon daily or apply topically.',
    dosage: '1-2 teaspoons of seeds daily, or 1 teaspoon of oil. Do not exceed 3 teaspoons of oil per day.',
    warnings: [
      'May slow blood clotting - avoid before surgery',
      'Can lower blood sugar significantly',
      'Pregnant women should avoid medicinal doses',
      'May interact with immunosuppressant medications'
    ],
    rating: 4.9,
    images: [],
    isPublished: true,
  },
  {
    id: 'guava-leaf',
    name: 'Guava Leaf',
    scientificName: 'Psidium guajava',
    category: 'digestion',
    origin: 'Tropical Africa, Americas',
    partsUsed: 'Leaves',
    description: 'Guava leaves are an underappreciated African remedy with remarkable antibacterial properties. They are especially effective for diarrhea, stomachaches, and wound healing.',
    longDescription: 'While guava fruit is popular, the leaves contain even more medicinal compounds. In many African villages, guava leaf tea is the first treatment for children with diarrhea. The leaves are rich in quercetin and other flavonoids that stop bacterial growth and reduce inflammation.',
    benefits: [
      'Stops diarrhea and dysentery quickly',
      'Reduces stomach pain and cramps',
      'Lowers blood sugar after meals',
      'Promotes wound healing when applied topically',
      'Supports oral health and reduces plaque',
      'May reduce cholesterol levels',
      'Has mild pain-relieving properties'
    ],
    medicinalUses: [
      'Acute diarrhea and stomach infections',
      'Toothaches and gum disease',
      'Skin wounds and cuts',
      'High blood sugar',
      'Menstrual cramps',
      'Cough and respiratory infections',
      'High cholesterol'
    ],
    preparation: 'Boil 10-15 fresh guava leaves in 3 cups of water for 15 minutes. Strain and drink 1 cup warm, 2-3 times daily. For wounds: crush fresh leaves and apply as poultice.',
    dosage: '1 cup of tea, 2-3 times daily until symptoms improve. For wounds: change poultice every 6 hours.',
    warnings: [
      'May cause constipation if overused',
      'Can lower blood sugar - monitor if diabetic',
      'Pregnant women should use in moderation',
      'Very safe overall, but discontinue if allergic reaction occurs'
    ],
    rating: 4.5,
    images: [],
    isPublished: true,
  },
  {
    id: 'pawpaw-leaf',
    name: 'Pawpaw Leaf',
    scientificName: 'Carica papaya',
    category: 'immunity',
    origin: 'Tropical Africa, Central America',
    partsUsed: 'Leaves, fruit, seeds, latex',
    description: 'Pawpaw (papaya) leaves are a powerful traditional remedy for boosting platelet count, fighting dengue fever, and supporting digestion with their enzyme-rich composition.',
    longDescription: 'Carica papaya is grown throughout tropical Africa. While the fruit is famous, the leaves contain even higher concentrations of papain and other enzymes. In traditional African medicine, pawpaw leaf tea is used to treat malaria, boost low platelet counts, and cleanse the digestive system.',
    benefits: [
      'Boosts platelet count naturally',
      'Rich in digestive enzymes (papain)',
      'Supports immune system function',
      'Has anti-malarial properties',
      'Promotes healthy skin and wound healing',
      'Supports menstrual regularity',
      'Natural deworming agent'
    ],
    medicinalUses: [
      'Low platelet count (thrombocytopenia)',
      'Malaria and fever',
      'Indigestion and bloating',
      'Intestinal worms and parasites',
      'Skin ulcers and wounds',
      'Irregular menstruation',
      'Dengue fever support'
    ],
    preparation: 'Crush 5-6 fresh leaves and boil in 2 cups of water for 15 minutes. Strain and drink 1 cup twice daily. The tea is very bitter - add honey. Can also juice raw leaves with pineapple.',
    dosage: '1 cup of tea, twice daily. For deworming: drink for 3 consecutive days. For platelets: drink for 5-7 days.',
    warnings: [
      'Very bitter taste may cause vomiting in some people',
      'May induce menstruation - pregnant women must avoid',
      'Can lower blood sugar',
      'Large amounts may cause stomach irritation'
    ],
    rating: 4.6,
    images: [],
    isPublished: true,
  },
  {
    id: 'lemon-grass',
    name: 'Lemon Grass',
    scientificName: 'Cymbopogon citratus',
    category: 'respiratory',
    origin: 'West Africa, Southeast Asia',
    partsUsed: 'Stalks, leaves',
    description: 'Lemon Grass is a fragrant tropical grass used across Africa for its calming, digestive, and respiratory benefits. Its citrusy aroma alone can reduce anxiety.',
    longDescription: 'Cymbopogon citratus is native to tropical regions and widely cultivated in West Africa. The essential oil contains citral, which has powerful antimicrobial and anti-inflammatory effects. It is commonly used in Nigerian and Ghanaian households for fever, colds, and as a calming bedtime tea.',
    benefits: [
      'Relieves anxiety and promotes sleep',
      'Aids digestion and reduces bloating',
      'Relieves respiratory congestion',
      'Lowers cholesterol levels',
      'Has antibacterial and antifungal properties',
      'Relieves menstrual cramps',
      'Natural insect repellent'
    ],
    medicinalUses: [
      'Anxiety, stress, and insomnia',
      'Indigestion and stomach cramps',
      'Cough, cold, and bronchitis',
      'High cholesterol',
      'Fever and heat exhaustion',
      'Headaches and migraines',
      'Muscle pain and spasms'
    ],
    preparation: 'Cut 2-3 stalks into pieces and boil in 4 cups of water for 10 minutes. Strain and drink 1 cup, 2-3 times daily. Can be combined with ginger and honey. For muscle pain: add lemongrass oil to bath water.',
    dosage: '1 cup of tea, 2-3 times daily. Essential oil: 2-3 drops in diffuser or diluted with carrier oil for massage.',
    warnings: [
      'May lower blood sugar - diabetics should monitor',
      'Can cause drowsiness - avoid before driving',
      'Pregnant women should avoid medicinal doses',
      'May interact with sedative medications'
    ],
    rating: 4.5,
    images: [],
    isPublished: true,
  },
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    scientificName: 'Cinnamomum verum',
    category: 'diabetes',
    origin: 'East Africa, Sri Lanka',
    partsUsed: 'Inner bark',
    description: 'Cinnamon is a beloved African spice with powerful medicinal properties. It is one of the most effective natural remedies for blood sugar control and metabolic health.',
    longDescription: 'True cinnamon (Ceylon cinnamon) and cassia cinnamon are both used across Africa. The bark contains cinnamaldehyde, which gives it both its distinctive flavor and its ability to mimic insulin and improve glucose uptake by cells. African traditional healers have long used it for diabetes and digestive complaints.',
    benefits: [
      'Significantly lowers fasting blood sugar',
      'Improves insulin sensitivity',
      'Reduces inflammation throughout the body',
      'Powerful antioxidant',
      'Fights bacterial and fungal infections',
      'May protect against neurodegenerative diseases',
      'Supports heart health by reducing cholesterol'
    ],
    medicinalUses: [
      'Type 2 diabetes and prediabetes',
      'Metabolic syndrome',
      'Polycystic ovary syndrome (PCOS)',
      'Digestive discomfort and gas',
      'Candida yeast overgrowth',
      'Arthritis and joint pain',
      'Cognitive decline and memory loss'
    ],
    preparation: 'Steep 1 cinnamon stick or 1/2 teaspoon of powder in hot water for 10 minutes. Add to oatmeal, smoothies, and stews. For topical: mix powder with honey for face masks.',
    dosage: '1/2 to 1 teaspoon of powder daily, or 1-2 cups of tea. Use Ceylon cinnamon for long-term daily use (cassia contains more coumarin).',
    warnings: [
      'Cassia cinnamon contains coumarin - do not exceed 1 teaspoon daily',
      'May interact with diabetes medications (can cause hypoglycemia)',
      'May interact with blood thinners',
      'Ceylon cinnamon is safer for long-term use'
    ],
    rating: 4.8,
    images: [],
    isPublished: true,
  },
  {
    id: 'garlic',
    name: 'Garlic',
    scientificName: 'Allium sativum',
    category: 'immunity',
    origin: 'Central Asia, naturalized across Africa',
    partsUsed: 'Bulbs (cloves)',
    description: 'Garlic is one of the most powerful natural antibiotics known to African traditional medicine. It has been used for millennia to fight infections, heart disease, and parasites.',
    longDescription: 'Garlic has been used in African medicine since ancient Egyptian times. Allicin, its active compound, is released when garlic is crushed or chopped. It is effective against bacteria, viruses, fungi, and parasites. No other herb has as much scientific evidence supporting its cardiovascular benefits.',
    benefits: [
      'Powerful natural antibiotic and antiviral',
      'Significantly reduces blood pressure',
      'Lowers LDL cholesterol and triglycerides',
      'Boosts immune system function',
      'Detoxifies heavy metals from the body',
      'Improves bone health in women',
      'May help prevent dementia and Alzheimer\'s'
    ],
    medicinalUses: [
      'Common cold and flu prevention',
      'Hypertension (high blood pressure)',
      'High cholesterol and heart disease',
      'Intestinal worms and parasites',
      'Fungal infections (including athlete\'s foot)',
      'Ear infections',
      'Food poisoning (kills salmonella and E. coli)'
    ],
    preparation: 'Crush 2-3 cloves and let sit for 10 minutes (activates allicin). Swallow with water, add to food, or steep in hot water for 10 minutes. For ear infections: crush cloves, mix with olive oil, warm slightly, and place drops in ear.',
    dosage: '1-2 cloves daily raw or lightly cooked. For therapeutic use: 2-4 cloves daily. Supplements: 600-1200mg aged garlic extract.',
    warnings: [
      'May increase bleeding risk - avoid before surgery',
      'Can cause bad breath and body odor',
      'May cause heartburn and digestive upset',
      'Can interact with HIV medications and blood thinners'
    ],
    rating: 4.9,
    images: [],
    isPublished: true,
  },
  {
    id: 'clove',
    name: 'Clove',
    scientificName: 'Syzygium aromaticum',
    category: 'pain-relief',
    origin: 'East Africa (Zanzibar), Indonesia',
    partsUsed: 'Dried flower buds, oil',
    description: 'Clove is an incredibly potent African spice with the highest antioxidant concentration of any food. It is famous for numbing tooth pain and fighting oral infections.',
    longDescription: 'The island of Zanzibar off the coast of Tanzania is one of the world\'s largest producers of cloves. Clove oil contains eugenol, a natural anesthetic that dentists still use today. In African traditional medicine, it is used for dental pain, digestive issues, and as a natural insect repellent.',
    benefits: [
      'Instant relief from toothache and gum pain',
      'Highest antioxidant content of any food',
      'Protects liver health and reduces inflammation',
      'Regulates blood sugar levels',
      'Promotes bone health and density',
      'Natural insect repellent (especially mosquitoes)',
      'May protect against stomach ulcers'
    ],
    medicinalUses: [
      'Toothache and dental abscesses',
      'Gum disease and oral infections',
      'Indigestion and gas',
      'Nausea and vomiting',
      'Headaches and migraines',
      'Insect bites and stings',
      'Respiratory infections'
    ],
    preparation: 'For toothache: place a whole clove near the painful tooth and bite gently to release oil. For tea: steep 3-4 cloves in hot water for 10 minutes. For skin: dilute clove oil heavily (1 drop in 1 tablespoon carrier oil).',
    dosage: 'Tea: 1 cup, 1-2 times daily. Clove oil: 1-2 drops diluted for topical use. Whole cloves: 1-3 per day as spice.',
    warnings: [
      'Clove oil is extremely strong - always dilute before skin application',
      'Can cause burns if undiluted oil touches skin',
      'May increase bleeding risk',
      'Pregnant women should avoid medicinal doses of oil'
    ],
    rating: 4.7,
    images: [],
    isPublished: true,
  },
  {
    id: 'rooibos',
    name: 'Rooibos',
    scientificName: 'Aspalathus linearis',
    category: 'nutrition',
    origin: 'South Africa (Cederberg region)',
    partsUsed: 'Leaves',
    description: 'Rooibos is a caffeine-free herbal tea indigenous to South Africa. It is rich in antioxidants, supports heart health, and is safe for babies and pregnant women.',
    longDescription: 'Rooibos (red bush) grows only in the Cederberg mountains of South Africa\'s Western Cape. The Khoisan people have used it for centuries. It contains aspalathin and nothofagin, unique antioxidants not found in other plants. It is completely caffeine-free and low in tannins, making it gentle for everyone.',
    benefits: [
      'Completely caffeine-free energy booster',
      'Rich in unique antioxidants aspalathin and quercetin',
      'Supports heart health and circulation',
      'Promotes healthy skin and may reduce wrinkles',
      'Safe for infants, children, and pregnant women',
      'May improve bone density',
      'Supports digestion without irritation'
    ],
    medicinalUses: [
      'Insomnia and sleep disorders',
      'Colic and stomach cramps in babies',
      'Allergies and hay fever',
      'Skin aging and eczema',
      'High blood pressure',
      'Liver conditions',
      'Anxiety and stress'
    ],
    preparation: 'Steep 1-2 teaspoons of loose rooibos or 1 tea bag in boiling water for 5-7 minutes. The longer it steeps, the more antioxidants are released. Delicious with milk and honey. Can be served hot or iced.',
    dosage: '2-3 cups daily, any time of day (caffeine-free). For babies: 1-2 tablespoons of weak tea for colic.',
    warnings: [
      'Very safe herb with minimal side effects',
      'May interact with chemotherapy drugs (antioxidant effect)',
      'Very rare allergic reactions reported',
      'May affect hormone levels in extreme doses'
    ],
    rating: 4.8,
    images: [],
    isPublished: true,
  },
  {
    id: 'buchu',
    name: 'Buchu',
    scientificName: 'Agathosma betulina',
    category: 'detox',
    origin: 'South Africa (Western Cape)',
    partsUsed: 'Leaves',
    description: 'Buchu is a fragrant South African shrub known as a potent urinary tract disinfectant and diuretic. It has been used by the Khoisan for thousands of years.',
    longDescription: 'Buchu is endemic to the mountains of the Western Cape. The leaves have a distinctive blackcurrant-like aroma. It contains diosphenol and other compounds that disinfect the urinary system. It was so valued that it was exported to Europe as early as the 1700s.',
    benefits: [
      'Disinfects the urinary tract and bladder',
      'Natural diuretic that reduces water retention',
      'Relieves symptoms of urinary tract infections',
      'Reduces inflammation in the prostate (BPH)',
      'Supports kidney health and detoxification',
      'May help with gout by flushing uric acid',
      'Has mild pain-relieving properties'
    ],
    medicinalUses: [
      'Urinary tract infections (UTIs)',
      'Bladder infections and cystitis',
      'Prostate enlargement (BPH)',
      'Kidney stones and gravel',
      'Gout and high uric acid',
      'Water retention and bloating',
      'Rheumatism and joint inflammation'
    ],
    preparation: 'Steep 1 teaspoon of dried buchu leaves in hot water for 5-7 minutes. The tea has a strong minty, blackcurrant flavor. Drink unsweetened for best medicinal effect.',
    dosage: '1 cup, 2-3 times daily during infection. For maintenance: 1 cup daily. Do not use for more than 2 weeks continuously.',
    warnings: [
      'Pregnant and breastfeeding women should avoid',
      'Can irritate the kidneys if overused',
      'May interact with lithium and diuretic medications',
      'Avoid if you have kidney disease'
    ],
    rating: 4.4,
    images: [],
    isPublished: true,
  },
  {
    id: 'devils-claw',
    name: 'Devil\'s Claw',
    scientificName: 'Harpagophytum procumbens',
    category: 'pain-relief',
    origin: 'Southern Africa (Kalahari Desert)',
    partsUsed: 'Tuberous roots',
    description: 'Devil\'s Claw is a desert plant from the Kalahari with powerful anti-inflammatory properties. It is one of the most effective herbal remedies for arthritis and back pain.',
    longDescription: 'Named for its hooked fruit that catches on animal fur, Devil\'s Claw has been used by the San people of the Kalahari for centuries. The root contains harpagoside, a compound clinically proven to reduce inflammation as effectively as some pharmaceutical drugs, but with fewer side effects.',
    benefits: [
      'Reduces arthritis pain and inflammation',
      'Relieves lower back pain and sciatica',
      'Decreases need for NSAID pain medications',
      'Supports digestive health and appetite',
      'May help with tendonitis and bursitis',
      'Has mild sedative effect for better sleep',
      'Supports heart health'
    ],
    medicinalUses: [
      'Osteoarthritis and rheumatoid arthritis',
      'Chronic lower back pain',
      'Tendonitis and sports injuries',
      'Gout attacks',
      'Loss of appetite and indigestion',
      'Muscle pain and fibromyalgia',
      'Heart conditions (traditional use)'
    ],
    preparation: 'Boil 1 teaspoon of dried, chopped root in 2 cups of water for 15 minutes. Strain and drink 1 cup, 2-3 times daily. Also available in capsule and tincture form.',
    dosage: 'Tea: 1 cup, 2-3 times daily. Capsules: follow product label (typically 400-800mg extract, 2-3 times daily).',
    warnings: [
      'May increase stomach acid - avoid with ulcers',
      'Can interact with blood thinners and heart medications',
      'May affect blood sugar levels',
      'Avoid during pregnancy and breastfeeding',
      'Gallstone patients should consult a doctor'
    ],
    rating: 4.6,
    images: [],
    isPublished: true,
  },
  {
    id: 'sutherlandia',
    name: 'Sutherlandia',
    scientificName: 'Sutherlandia frutescens',
    category: 'immunity',
    origin: 'Southern Africa',
    partsUsed: 'Leaves, stems',
    description: 'Sutherlandia, known as the "Cancer Bush," is a legendary South African immune tonic. It has been used for centuries to treat cancer, HIV/AIDS symptoms, and wasting diseases.',
    longDescription: 'Sutherlandia frutescens is one of South Africa\'s most celebrated medicinal plants. Traditional healers use it as a general tonic and specifically for people with cancer, HIV, tuberculosis, and severe stress. It contains L-canavanine and other compounds that modulate the immune system.',
    benefits: [
      'Modulates and strengthens immune system',
      'Improves appetite and combats wasting',
      'Reduces anxiety and improves mood',
      'Supports people undergoing cancer treatment',
      'May have anti-viral properties',
      'Improves energy levels in chronically ill patients',
      'Supports liver function'
    ],
    medicinalUses: [
      'HIV/AIDS support and symptom management',
      'Cancer (as complementary support)',
      'Tuberculosis and chronic infections',
      'Severe anxiety and stress',
      'Rheumatoid arthritis',
      'Type 2 diabetes',
      'Chronic fatigue and wasting'
    ],
    preparation: 'Steep 1 teaspoon of dried leaves in hot water for 10 minutes. The tea is bitter - add honey. Can also be taken as capsules or tincture. Traditional preparation involves fermenting the leaves.',
    dosage: '1 cup of tea, 2-3 times daily. Capsules: 300-400mg, 2 times daily. Use consistently for at least 4-6 weeks for immune benefits.',
    warnings: [
      'May interact with antiretroviral medications - consult HIV specialist',
      'Can cause dry mouth and mild constipation',
      'Pregnant women should avoid',
      'May lower blood sugar - monitor if diabetic',
      'Do not replace conventional cancer treatment without doctor approval'
    ],
    rating: 4.5,
    images: [],
    isPublished: true,
  },
  {
    id: 'uziza',
    name: 'Uziza',
    scientificName: 'Piper guineense',
    category: 'digestion',
    origin: 'West Africa (Nigeria, Ghana)',
    partsUsed: 'Seeds, leaves',
    description: 'Uziza is a peppery West African spice with remarkable digestive and respiratory benefits. It is a staple in Nigerian traditional medicine and cuisine.',
    longDescription: 'Piper guineense, known as Uziza in Igbo and Iyere in Yoruba, is a climbing vine native to West African forests. The seeds have a peppery, slightly bitter taste and are rich in essential oils. It is used both as a spice in soups and as a medicine for cough, digestive issues, and fertility.',
    benefits: [
      'Improves digestion and reduces bloating',
      'Relieves cough and respiratory congestion',
      'Has natural contraceptive properties (traditional)',
      'Rich in antioxidants and minerals',
      'May improve fertility in women (leaf)',
      'Natural pain reliever for headaches',
      'Antimicrobial against food-borne bacteria'
    ],
    medicinalUses: [
      'Indigestion and stomach pain',
      'Cough, cold, and bronchitis',
      'Loss of appetite',
      'Menstrual pain',
      'Rheumatism and joint pain',
      'Intestinal worms',
      'Postpartum recovery (leaves in soup)'
    ],
    preparation: 'Crush seeds and add to soups and stews (traditional West African pepper soup). For tea: crush 1 teaspoon of seeds, boil in water for 10 minutes. For cough: chew 2-3 seeds slowly.',
    dosage: 'Culinary: use as spice to taste. Medicinal tea: 1 cup, twice daily. Seeds: 2-3 for cough relief.',
    warnings: [
      'Seeds may have contraceptive effects - avoid if trying to conceive',
      'Very peppery - may irritate sensitive stomachs',
      'Can interact with blood-thinning medications',
      'Pregnant women should use leaves only (in food amounts)'
    ],
    rating: 4.4,
    images: [],
    isPublished: true,
  },
  {
    id: 'hoodia',
    name: 'Hoodia',
    scientificName: 'Hoodia gordonii',
    category: 'nutrition',
    origin: 'Southern Africa (Kalahari Desert)',
    partsUsed: 'Stems',
    description: 'Hoodia is a cactus-like plant from the Kalahari Desert used by the San people to suppress hunger during long hunting trips. It is a powerful natural appetite suppressant.',
    longDescription: 'Hoodia gordonii grows in the arid Kalahari Desert and can reach over 1 meter in height. The San Bushmen have chewed the bitter stems for thousands of years to stave off hunger and thirst during extended hunting expeditions. The active compound P57 is believed to trick the brain into feeling full.',
    benefits: [
      'Powerful natural appetite suppressant',
      'Reduces food cravings and snacking',
      'Supports weight loss efforts',
      'Increases energy and stamina',
      'Reduces thirst in desert conditions',
      'May improve mood while dieting',
      'Does not contain stimulants like caffeine'
    ],
    medicinalUses: [
      'Obesity and weight management',
      'Emotional eating and food cravings',
      'Metabolic syndrome',
      'Type 2 diabetes (via weight loss)',
      'Low energy and fatigue',
      'Digestive rest and cleansing'
    ],
    preparation: 'Traditional: peel and chew the fresh stem (very bitter). Modern: take standardized extract capsules. Tea is not effective as the active compounds are not water-soluble.',
    dosage: 'Capsules: follow product label (typically 400-800mg, 1 hour before meals). Traditional: chew a 2-inch piece of fresh stem.',
    warnings: [
      'May suppress thirst - ensure adequate water intake',
      'Pregnant and breastfeeding women should avoid',
      'May interact with diabetes and blood pressure medications',
      'Can cause mild nausea and stomach upset initially',
      'Ensure you buy authentic Hoodia (many fakes on market)'
    ],
    rating: 4.2,
    images: [],
    isPublished: true,
  },
  {
    id: 'african-basil',
    name: 'African Basil',
    scientificName: 'Ocimum basilicum',
    category: 'immunity',
    origin: 'Tropical Africa',
    partsUsed: 'Leaves, seeds',
    description: 'African Basil is a fragrant herb used across the continent for respiratory infections, mosquito repellent, and digestive support. It is stronger than Mediterranean basil.',
    longDescription: 'African varieties of basil, including the East African "tree basil," are more pungent and medicinally potent than their European cousins. The leaves contain high concentrations of eugenol and camphor. In many African homes, basil plants are grown near doorways to repel mosquitoes and flies.',
    benefits: [
      'Repels mosquitoes and biting insects naturally',
      'Relieves respiratory infections and congestion',
      'Supports digestion and reduces gas',
      'Has antibacterial and antiviral properties',
      'Reduces stress and mental fatigue',
      'May help lower blood sugar',
      'Supports eye health (vitamin A)'
    ],
    medicinalUses: [
      'Malaria and fever (supportive)',
      'Cough and chest congestion',
      'Stomachaches and indigestion',
      'Mosquito bites and skin irritation',
      'Headaches and mental exhaustion',
      'Ear infections',
      'Nausea and vomiting'
    ],
    preparation: 'For tea: steep a handful of fresh leaves in hot water for 5 minutes. For mosquito repellent: crush leaves and rub on skin. For steam: boil leaves and inhale vapors.',
    dosage: 'Tea: 1-2 cups daily. Topical: apply crushed leaves as needed. Steam: inhale for 10 minutes, twice daily.',
    warnings: [
      'May slow blood clotting',
      'Can lower blood pressure and blood sugar',
      'Pregnant women should use in moderation',
      'May interact with diabetes medications'
    ],
    rating: 4.3,
    images: [],
    isPublished: true,
  },
  {
    id: 'pelargonium',
    name: 'Pelargonium (Umckaloabo)',
    scientificName: 'Pelargonium sidoides',
    category: 'respiratory',
    origin: 'South Africa, Lesotho',
    partsUsed: 'Roots',
    description: 'Pelargonium sidoides is a South African geranium with clinically proven effectiveness against respiratory infections. It is one of the few traditional African herbs accepted by mainstream medicine worldwide.',
    longDescription: 'The roots of this small geranium have been used by Zulu, Xhosa, and Basotho traditional healers for centuries to treat coughs, tuberculosis, and gastrointestinal infections. Modern clinical trials have confirmed it shortens the duration of bronchitis, sinusitis, and the common cold. It is now a registered medicine in Europe.',
    benefits: [
      'Clinically proven to treat acute bronchitis',
      'Shortens duration of colds and sinus infections',
      'Has direct antibacterial and antiviral effects',
      'Boosts immune response in the respiratory tract',
      'Reduces severity of sore throat',
      'May help with tonsillitis',
      'Supports recovery from chronic lung infections'
    ],
    medicinalUses: [
      'Acute bronchitis and chest infections',
      'Common cold and flu',
      'Sinusitis and sinus infections',
      'Sore throat and tonsillitis',
      'Chronic obstructive pulmonary disease (COPD)',
      'Tuberculosis (as complementary support)',
      'Gastrointestinal infections'
    ],
    preparation: 'Most commonly taken as a standardized liquid extract (EPs 7630). Can also be made as decoction: boil 1 teaspoon chopped root in 2 cups water for 10 minutes. Strain and drink.',
    dosage: 'Liquid extract: follow product label (typically 30 drops, 3 times daily). Tea: 1 cup, 3 times daily for acute infection.',
    warnings: [
      'May increase bleeding risk - avoid with blood thinners',
      'Can worsen liver disease - avoid with severe liver conditions',
      'May interact with immunosuppressant medications',
      'Pregnant and breastfeeding women should consult doctor',
      'Rare cases of liver damage reported at very high doses'
    ],
    rating: 4.8,
    images: [],
    isPublished: true,
  }
];

async function seedHerbs() {
  console.log('🌿 Starting herb database seeding...\n');
  
  const batch = db.batch();
  let count = 0;
  
  for (const herb of herbs) {
    const ref = db.collection('herbs').doc(herb.id);
    
    batch.set(ref, {
      ...herb,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    count++;
    console.log(`✅ Queued: ${herb.name} (${herb.scientificName})`);
  }
  
  await batch.commit();
  
  console.log(`\n🎉 SUCCESS! Seeded ${count} herbs into Firestore.`);
  console.log('\nCategories included:');
  const categories = [...new Set(herbs.map(h => h.category))];
  categories.forEach(cat => console.log(`  • ${cat}`));
  
  process.exit(0);
}

seedHerbs().catch(err => {
  console.error('❌ Error seeding herbs:', err.message);
  process.exit(1);
});