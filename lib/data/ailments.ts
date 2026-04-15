export interface AilmentData {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  symptoms: string[];
  medicalDisclaimer: string;
  commonInAfrica: boolean;
  associatedHerbs: string[]; // Herb names that treat this
}

export const ailmentsData: AilmentData[] = [
  // MENTAL WELLNESS
  {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mental-wellness',
    categoryLabel: 'Mental Wellness',
    description: 'A feeling of worry, nervousness, or unease about something with an uncertain outcome. In traditional African medicine, anxiety is often viewed as an imbalance of the spirit and mind, treated with calming herbs and spiritual practices.',
    symptoms: ['Excessive worrying', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Irritability', 'Muscle tension', 'Sleep problems', 'Racing heart', 'Sweating'],
    medicalDisclaimer: 'While occasional anxiety is normal, persistent anxiety may indicate Generalized Anxiety Disorder (GAD), Panic Disorder, or Social Anxiety Disorder. Professional diagnosis and laboratory tests are recommended.',
    commonInAfrica: true,
    associatedHerbs: ['Ashwagandha', 'Valerian Root', 'Passion Flower']
  },
  {
    id: 'stress',
    name: 'Stress',
    category: 'mental-wellness',
    categoryLabel: 'Mental Wellness',
    description: 'Physical, mental, or emotional strain or tension resulting from adverse or demanding circumstances. Chronic stress affects all body systems and is a major concern in modern African urban life.',
    symptoms: ['Headaches', 'Muscle tension', 'Chest pain', 'Fatigue', 'Stomach upset', 'Sleep problems', 'Irritability', 'Feeling overwhelmed', 'High blood pressure'],
    medicalDisclaimer: 'Chronic stress can lead to serious health problems including heart disease, high blood pressure, diabetes, and mental health disorders. Please consult a healthcare provider.',
    commonInAfrica: true,
    associatedHerbs: ['Lemon Balm', 'Chamomile', 'Holy Basil']
  },
  {
    id: 'insomnia',
    name: 'Insomnia',
    category: 'mental-wellness',
    categoryLabel: 'Mental Wellness',
    description: 'Persistent problems falling and staying asleep. In traditional African healing, sleep disturbances are often linked to spiritual unrest or imbalances in natural body rhythms.',
    symptoms: ['Difficulty falling asleep', 'Waking up during the night', 'Waking up too early', 'Daytime tiredness', 'Irritability', 'Depression', 'Anxiety', 'Difficulty paying attention'],
    medicalDisclaimer: 'Insomnia may be a symptom of underlying medical conditions such as sleep apnea, restless leg syndrome, or thyroid problems. Medical evaluation is recommended.',
    commonInAfrica: true,
    associatedHerbs: ['Valerian Root', 'Lavender', 'Wild Lettuce']
  },
  {
    id: 'depression',
    name: 'Depression',
    category: 'mental-wellness',
    categoryLabel: 'Mental Wellness',
    description: 'A mood disorder causing persistent feelings of sadness and loss of interest. Traditional African healers often address depression through a combination of herbal remedies, community support, and spiritual cleansing.',
    symptoms: ['Persistent sad mood', 'Loss of interest in activities', 'Changes in appetite', 'Sleep disturbances', 'Fatigue', 'Feelings of worthlessness', 'Difficulty thinking', 'Thoughts of death'],
    medicalDisclaimer: 'Depression is a serious medical condition. If you experience thoughts of self-harm, seek immediate medical help. Professional diagnosis and treatment are essential.',
    commonInAfrica: true,
    associatedHerbs: ['St. John\'s Wort', 'Saffron', 'Rhodiola']
  },
  {
    id: 'adhd',
    name: 'ADHD',
    category: 'mental-wellness',
    categoryLabel: 'Mental Wellness',
    description: 'Attention-deficit/hyperactivity disorder affecting focus and impulse control. While modern concept, traditional African approaches use calming and focusing herbs.',
    symptoms: ['Difficulty focusing', 'Hyperactivity', 'Impulsiveness', 'Disorganization', 'Poor time management', 'Mood swings', 'Trouble multitasking'],
    medicalDisclaimer: 'ADHD requires professional diagnosis, typically involving behavioral assessments and medical history review. Herbal remedies should complement, not replace, prescribed treatments.',
    commonInAfrica: false,
    associatedHerbs: ['Ginkgo Biloba', 'Bacopa Monnieri', 'Green Tea']
  },

  // PAIN RELIEF
  {
    id: 'migraine',
    name: 'Migraine',
    category: 'pain-relief',
    categoryLabel: 'Pain Relief',
    description: 'Severe, recurring headaches often accompanied by nausea and sensitivity to light. Traditional African healers use specific plants known for their analgesic and anti-inflammatory properties.',
    symptoms: ['Severe headache', 'Nausea', 'Vomiting', 'Sensitivity to light', 'Sensitivity to sound', 'Visual disturbances', 'Dizziness', 'Neck stiffness'],
    medicalDisclaimer: 'Migraines can be debilitating and may require prescription medication. Severe or sudden headaches should be evaluated by a doctor to rule out other conditions.',
    commonInAfrica: true,
    associatedHerbs: ['Feverfew', 'Butterbur', 'Peppermint']
  },
  {
    id: 'arthritis',
    name: 'Arthritis',
    category: 'pain-relief',
    categoryLabel: 'Pain Relief',
    description: 'Inflammation of one or more joints, causing pain and stiffness. Very common in African elderly populations, traditionally treated with anti-inflammatory herbs and topical applications.',
    symptoms: ['Joint pain', 'Stiffness', 'Swelling', 'Redness', 'Decreased range of motion', 'Warmth around joints', 'Morning stiffness'],
    medicalDisclaimer: 'Arthritis includes various types (osteoarthritis, rheumatoid arthritis) requiring different treatments. X-rays and blood tests are needed for proper diagnosis.',
    commonInAfrica: true,
    associatedHerbs: ['Turmeric', 'Ginger', 'Devil\'s Claw']
  },
  {
    id: 'menstrual-cramps',
    name: 'Menstrual Cramps',
    category: 'pain-relief',
    categoryLabel: 'Pain Relief',
    description: 'Painful menstrual periods affecting many women. Traditional African medicine has long used specific plants to ease menstrual discomfort and regulate cycles.',
    symptoms: ['Lower abdominal pain', 'Cramping', 'Back pain', 'Nausea', 'Headache', 'Dizziness', 'Loose stools'],
    medicalDisclaimer: 'Severe menstrual pain may indicate underlying conditions like endometriosis or fibroids. If pain is debilitating, seek medical evaluation.',
    commonInAfrica: true,
    associatedHerbs: ['Cramp Bark', 'Black Cohosh', 'Raspberry Leaf']
  },
  {
    id: 'back-pain',
    name: 'Back Pain',
    category: 'pain-relief',
    categoryLabel: 'Pain Relief',
    description: 'Pain affecting the back, often caused by muscle strain, poor posture, or underlying conditions. Common among manual laborers and those with sedentary lifestyles.',
    symptoms: ['Muscle ache', 'Shooting pain', 'Pain radiating down leg', 'Limited flexibility', 'Difficulty standing straight', 'Stiffness'],
    medicalDisclaimer: 'Persistent back pain may indicate herniated discs, kidney problems, or other serious conditions. Imaging tests (X-ray, MRI) may be necessary.',
    commonInAfrica: true,
    associatedHerbs: ['White Willow Bark', 'Devil\'s Claw', 'Cayenne Pepper']
  },
  {
    id: 'toothache',
    name: 'Toothache',
    category: 'pain-relief',
    categoryLabel: 'Pain Relief',
    description: 'Pain in or around a tooth. Traditional African communities use specific plants for dental pain relief and oral hygiene.',
    symptoms: ['Sharp tooth pain', 'Throbbing', 'Swelling around tooth', 'Fever', 'Headache', 'Bad taste in mouth', 'Sensitivity to hot/cold'],
    medicalDisclaimer: 'Toothaches often indicate cavities, infections, or abscesses requiring dental treatment. Herbal remedies provide temporary relief only.',
    commonInAfrica: true,
    associatedHerbs: ['Clove Oil', 'Neem', 'Guava Leaves']
  },

  // DIGESTIVE HEALTH
  {
    id: 'constipation',
    name: 'Constipation',
    category: 'digestive-health',
    categoryLabel: 'Digestive Health',
    description: 'Difficulty passing stools or infrequent bowel movements. Dietary changes and specific African fiber-rich herbs are traditionally used.',
    symptoms: ['Fewer than 3 bowel movements per week', 'Hard stools', 'Straining', 'Feeling of blockage', 'Abdominal pain', 'Bloating'],
    medicalDisclaimer: 'Chronic constipation may indicate thyroid issues, diabetes, or neurological conditions. Sudden changes in bowel habits require medical attention.',
    commonInAfrica: true,
    associatedHerbs: ['Senna', 'Aloe Vera', 'Psyllium Husk']
  },
  {
    id: 'diarrhea',
    name: 'Diarrhea',
    category: 'digestive-health',
    categoryLabel: 'Digestive Health',
    description: 'Loose, watery stools occurring more frequently than usual. Common in areas with water quality issues, traditionally treated with binding and antimicrobial herbs.',
    symptoms: ['Loose stools', 'Abdominal cramps', 'Urgency', 'Bloating', 'Nausea', 'Fever', 'Blood in stool (severe cases)'],
    medicalDisclaimer: 'Persistent diarrhea can cause dangerous dehydration, especially in children and elderly. Seek immediate care if blood present or fever high.',
    commonInAfrica: true,
    associatedHerbs: ['African Potato', 'Berberine', 'Pomegranate Peel']
  },
  {
    id: 'indigestion',
    name: 'Indigestion',
    category: 'digestive-health',
    categoryLabel: 'Digestive Health',
    description: 'Discomfort or pain in the upper abdomen, often after eating. Traditional African after-meal rituals often include digestive herbs.',
    symptoms: ['Upper abdominal pain', 'Bloating', 'Nausea', 'Belching', 'Acidic taste', 'Fullness during meal', 'Burning sensation'],
    medicalDisclaimer: 'Persistent indigestion may indicate ulcers, GERD, or gallbladder disease. Endoscopy may be needed for diagnosis.',
    commonInAfrica: true,
    associatedHerbs: ['Ginger', 'Peppermint', 'Fennel']
  },
  {
    id: 'stomach-ulcer',
    name: 'Stomach Ulcer',
    category: 'digestive-health',
    categoryLabel: 'Digestive Health',
    description: 'Open sores that develop on the inside lining of the stomach. Some African traditional plants are being studied for their ulcer-healing properties.',
    symptoms: ['Burning stomach pain', 'Feeling of fullness', 'Bloating', 'Nausea', 'Vomiting', 'Weight loss', 'Dark stools'],
    medicalDisclaimer: 'Ulcers require medical diagnosis (endoscopy) and treatment. H. pylori infection is a common cause requiring antibiotics.',
    commonInAfrica: true,
    associatedHerbs: ['Licorice Root', 'Aloe Vera', 'Cabbage Juice']
  },
  {
    id: 'hemorrhoids',
    name: 'Hemorrhoids',
    category: 'digestive-health',
    categoryLabel: 'Digestive Health',
    description: 'Swollen veins in the lower rectum and anus. Very common condition treated traditionally with astringent and anti-inflammatory herbs.',
    symptoms: ['Rectal pain', 'Itching', 'Bleeding during bowel movements', 'Swelling', 'Lump near anus', 'Leakage of feces'],
    medicalDisclaimer: 'Rectal bleeding can indicate more serious conditions like colorectal cancer. Bleeding should always be evaluated by a doctor.',
    commonInAfrica: true,
    associatedHerbs: ['Witch Hazel', 'Horse Chestnut', 'Aloe Vera']
  },

  // IMMUNE SUPPORT
  {
    id: 'common-cold',
    name: 'Common Cold',
    category: 'immune-support',
    categoryLabel: 'Immune Support',
    description: 'A viral infection of the upper respiratory tract. African traditional medicine has numerous remedies for cold symptoms and immune boosting.',
    symptoms: ['Runny nose', 'Sore throat', 'Cough', 'Congestion', 'Sneezing', 'Mild fever', 'Fatigue', 'Body aches'],
    medicalDisclaimer: 'While colds are usually harmless, similar symptoms can indicate flu or COVID-19. Seek testing if symptoms are severe.',
    commonInAfrica: true,
    associatedHerbs: ['Echinacea', 'Elderberry', 'African Potato']
  },
  {
    id: 'malaria-fever',
    name: 'Malaria Fever',
    category: 'immune-support',
    categoryLabel: 'Immune Support',
    description: 'A mosquito-borne infectious disease very common in Africa. While antimalarial drugs are essential, some traditional herbs are used for symptomatic relief and immune support alongside medical treatment.',
    symptoms: ['High fever', 'Chills', 'Headache', 'Muscle pain', 'Fatigue', 'Nausea', 'Vomiting', 'Sweating'],
    medicalDisclaimer: 'MALARIA IS A MEDICAL EMERGENCY. This platform provides only supportive information. You MUST seek immediate medical care and take prescribed antimalarial drugs. Herbal remedies are supplementary only.',
    commonInAfrica: true,
    associatedHerbs: ['Neem', 'Artemisia Annua', 'Grapefruit Seed']
  },
  {
    id: 'typhoid',
    name: 'Typhoid Fever',
    category: 'immune-support',
    categoryLabel: 'Immune Support',
    description: 'A bacterial infection spread through contaminated food and water. Common in areas with poor sanitation. Requires antibiotics but traditional herbs may support recovery.',
    symptoms: ['High fever', 'Weakness', 'Stomach pain', 'Headache', 'Loss of appetite', 'Rash', 'Constipation or diarrhea'],
    medicalDisclaimer: 'Typhoid requires antibiotics and medical supervision. Blood culture is needed for diagnosis. Do not rely solely on herbal remedies.',
    commonInAfrica: true,
    associatedHerbs: ['Garlic', 'Ginger', 'Thyme']
  },
  {
    id: 'hiv-support',
    name: 'HIV/AIDS Support',
    category: 'immune-support',
    categoryLabel: 'Immune Support',
    description: 'Support for immune function in individuals living with HIV/AIDS. Some African plants are studied for immune-modulating properties to complement ARV therapy.',
    symptoms: ['Chronic fatigue', 'Weight loss', 'Frequent infections', 'Fever', 'Night sweats', 'Skin rashes'],
    medicalDisclaimer: 'HIV requires antiretroviral therapy (ART). Never stop or replace ARVs with herbal remedies. Herbs should only support overall health under doctor supervision.',
    commonInAfrica: true,
    associatedHerbs: ['African Potato', 'Sutherlandia', 'Moringa']
  },
  {
    id: 'weak-immunity',
    name: 'Weak Immunity',
    category: 'immune-support',
    categoryLabel: 'Immune Support',
    description: 'Frequent illness due to compromised immune system. Traditional African immune boosters are widely used, especially for children and elderly.',
    symptoms: ['Frequent infections', 'Long recovery time', 'Fatigue', 'Digestive issues', 'Slow wound healing', 'Autoimmune conditions'],
    medicalDisclaimer: 'Frequent illness may indicate underlying conditions like diabetes, anemia, or immune disorders. Blood tests are recommended.',
    commonInAfrica: true,
    associatedHerbs: ['Echinacea', 'Astragalus', 'Moringa']
  },

  // SKIN CARE
  {
    id: 'eczema',
    name: 'Eczema',
    category: 'skin-care',
    categoryLabel: 'Skin Care',
    description: 'A condition making skin red and itchy. Very common in children. African traditional medicine uses various soothing and moisturizing plants.',
    symptoms: ['Dry skin', 'Itching', 'Red patches', 'Small bumps', 'Thickened skin', 'Raw sensitive skin', 'Dark patches (on dark skin)'],
    medicalDisclaimer: 'Eczema can be confused with psoriasis or fungal infections. Persistent skin changes should be evaluated by a dermatologist.',
    commonInAfrica: true,
    associatedHerbs: ['Aloe Vera', 'Coconut Oil', 'Neem']
  },
  {
    id: 'acne',
    name: 'Acne',
    category: 'skin-care',
    categoryLabel: 'Skin Care',
    description: 'Inflammatory skin condition causing pimples and spots. Traditional African skincare often incorporates natural antibacterial and oil-balancing plants.',
    symptoms: ['Whiteheads', 'Blackheads', 'Papules', 'Pimples', 'Nodules', 'Cysts', 'Oily skin', 'Scarring'],
    medicalDisclaimer: 'Severe acne can cause permanent scarring. Hormonal testing may be needed for persistent adult acne.',
    commonInAfrica: true,
    associatedHerbs: ['Tea Tree Oil', 'Neem', 'Aloe Vera']
  },
  {
    id: 'fungal-infection',
    name: 'Fungal Infection',
    category: 'skin-care',
    categoryLabel: 'Skin Care',
    description: 'Common skin infections including ringworm (tinea) and athlete\'s foot. Very prevalent in hot, humid African climates. Treated with antifungal herbs.',
    symptoms: ['Itchy skin', 'Red rash', 'Ring-shaped patches', 'Scaly skin', 'Blisters', 'Discolored nails', 'Hair loss (scalp)'],
    medicalDisclaimer: 'Fungal infections require antifungal treatment. KOH preparation test confirms diagnosis. Diabetes can predispose to recurrent fungal infections.',
    commonInAfrica: true,
    associatedHerbs: ['Neem', 'Tea Tree Oil', 'Garlic']
  },
  {
    id: 'burns',
    name: 'Burns',
    category: 'skin-care',
    categoryLabel: 'Skin Care',
    description: 'Injury to skin caused by heat, chemicals, electricity, or radiation. Traditional African medicine has specific plants for burn healing and scar reduction.',
    symptoms: ['Red skin', 'Pain', 'Swelling', 'Blisters', 'Peeling skin', 'White or charred skin (severe)', 'Shock (severe)'],
    medicalDisclaimer: 'Third-degree burns and large burn areas require emergency medical care. Infection is a major risk with burns.',
    commonInAfrica: true,
    associatedHerbs: ['Aloe Vera', 'Honey', 'Lavender Oil']
  },
  {
    id: 'wounds',
    name: 'Wounds & Cuts',
    category: 'skin-care',
    categoryLabel: 'Skin Care',
    description: 'Breaks in the skin requiring cleaning and healing support. Traditional African wound care includes antiseptic and wound-healing plants.',
    symptoms: ['Open skin', 'Bleeding', 'Pain', 'Swelling', 'Redness', 'Pus (if infected)', 'Fever (if infected)'],
    medicalDisclaimer: 'Deep wounds, animal bites, or heavily contaminated wounds require medical attention and possibly tetanus shots.',
    commonInAfrica: true,
    associatedHerbs: ['Aloe Vera', 'Calendula', 'Honey']
  },

  // RESPIRATORY
  {
    id: 'asthma',
    name: 'Asthma',
    category: 'respiratory',
    categoryLabel: 'Respiratory Health',
    description: 'A condition causing difficulty breathing due to narrowed airways. Increasingly common in African urban areas. Traditional herbs may support but do not replace inhalers.',
    symptoms: ['Shortness of breath', 'Chest tightness', 'Wheezing', 'Coughing', 'Difficulty sleeping', 'Rapid breathing'],
    medicalDisclaimer: 'Asthma can be life-threatening. Always carry prescribed inhalers. Herbal remedies are supplementary only.',
    commonInAfrica: true,
    associatedHerbs: ['Eucalyptus', 'Ginger', 'Thyme']
  },
  {
    id: 'bronchitis',
    name: 'Bronchitis',
    category: 'respiratory',
    categoryLabel: 'Respiratory Health',
    description: 'Inflammation of the bronchial tubes, often following a cold. Traditional African medicine uses expectorant and anti-inflammatory herbs.',
    symptoms: ['Cough', 'Mucus production', 'Fatigue', 'Shortness of breath', 'Chest discomfort', 'Low fever', 'Wheezing'],
    medicalDisclaimer: 'Chronic bronchitis may indicate COPD. Chest X-ray and pulmonary function tests may be needed.',
    commonInAfrica: true,
    associatedHerbs: ['Mullein', 'Thyme', 'Eucalyptus']
  },
  {
    id: 'sinusitis',
    name: 'Sinusitis',
    category: 'respiratory',
    categoryLabel: 'Respiratory Health',
    description: 'Inflammation of the sinuses causing facial pain and congestion. Common during harmattan season in West Africa.',
    symptoms: ['Facial pain', 'Nasal congestion', 'Headache', 'Thick nasal discharge', 'Reduced smell', 'Cough', 'Bad breath'],
    medicalDisclaimer: 'Chronic sinusitis may require antibiotics or surgery. CT scan may be needed for recurrent cases.',
    commonInAfrica: true,
    associatedHerbs: ['Eucalyptus', 'Peppermint', 'Ginger']
  },
  {
    id: 'sore-throat',
    name: 'Sore Throat',
    category: 'respiratory',
    categoryLabel: 'Respiratory Health',
    description: 'Pain or irritation in the throat, often first sign of respiratory infection. Traditional African gargles and soothing herbs are commonly used.',
    symptoms: ['Painful swallowing', 'Scratchy sensation', 'Dry throat', 'Redness', 'Swollen glands', 'Hoarse voice', 'White patches (strep)'],
    medicalDisclaimer: 'Strep throat requires antibiotics to prevent rheumatic fever. Throat culture confirms diagnosis.',
    commonInAfrica: true,
    associatedHerbs: ['Sage', 'Slippery Elm', 'Honey']
  },
  {
    id: 'allergies',
    name: 'Allergies',
    category: 'respiratory',
    categoryLabel: 'Respiratory Health',
    description: 'Immune system reaction to foreign substances. Increasing prevalence in Africa due to urbanization and changing environments.',
    symptoms: ['Sneezing', 'Runny nose', 'Itchy eyes', 'Watery eyes', 'Congestion', 'Wheezing', 'Skin rash'],
    medicalDisclaimer: 'Allergies can trigger asthma attacks. Allergy testing identifies triggers. Anaphylaxis requires emergency care.',
    commonInAfrica: true,
    associatedHerbs: ['Nettle', 'Butterbur', 'Quercetin']
  }
];

// Helper functions
export const getAilmentsByCategory = (category: string) => {
  return ailmentsData.filter(a => a.category === category);
};

export const getAilmentById = (id: string) => {
  return ailmentsData.find(a => a.id === id);
};

export const getAllCategories = () => {
  const categories = new Set(ailmentsData.map(a => a.category));
  return Array.from(categories);
};