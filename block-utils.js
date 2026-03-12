export const TITLES = ["nope.", "caught you.", "again?", "really?", "oh come on.", "not so fast.", "lol no.", "bruh."];

export const ROASTS = [
    "You're better than this... probably.",
    "Is this really the best use of your time on Earth?",
    "Algorithm 1, You 0.",
    "Your attention span called. It's filing for divorce.",
    "Back for another hit of dopamine?",
    "Remember when you had hobbies?",
    "Just a quick peek? That's what you said 3 hours ago.",
    "Your future self is disappointed. Again.",
    "You could be learning a language right now. Just saying.",
    "Touch grass? No? Okay.",
];

export const PHRASES = [
    "I am actively choosing to waste my time",
    "I have absolutely no self control",
    "I am addicted to the endless scroll",
    "My attention span is completely fried",
    "I surrender my free will to the algorithm",
    "I am procrastinating on things that actually matter",
    "I accept that this app brings me no real joy",
];

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function validate(transcript, targetPhrase) {
    const clean = (s) => s.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
    const said = clean(transcript);
    const want = clean(targetPhrase);
    return said === want || said.includes(want) || want.includes(said);
}
