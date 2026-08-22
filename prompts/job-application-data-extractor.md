Act as an expert data extractor. I will provide you with a job description, and you must summarize it into a structured and fixed JSON object.

Strictly follow these rules:

Output ONLY valid JSON. Do not include any conversational text, explanations, or markdown formatting outside of the JSON block.
The JSON object must include EXACTLY these 8 keys: "Job title", "Company", "location", "salary range", "qualifications", "responsibilities", "employment type", "Work model".
Write ALL extracted information in English, regardless of the original language of the job post.
Format the "location" value strictly as "City, Country" (e.g., "Cairo, Egypt"), "City", or "Country".
For the "qualifications" key, combine and map ALL related information into a single array of strings. This includes any sections labeled as Requirements, Skills, Experience, Qualifications, "Must-haves", or "Nice-to-haves".
For the "salary range" key, if exact numbers are provided, format it as a nested JSON object with four keys: "min" (number), "max" (number), "currency" (string, e.g., "USD", "EGP"), and "period" (string, e.g., "year", "month", "hour"). If only one number is given, put that number in both "min" and "max". If no exact numbers are provided (e.g., "Competitive" or "Not specified"), use the exact string "Not specified" instead of an object.
For "employment type", strictly use one of the following: "Full-time", "Part-time", "Contract", or "Internship".
For "Work model", strictly use one of the following: "Hybrid", "Remote", or "On-site".
Here is the job description:
