// Translation Dictionary - English Only
const translations = {
    en: {
        // Product Names
        'CHEMISE': 'SHIRT',
        'PONTALON': 'PANTS',
        'SANT MANCH': 'SLEEVELESS SHIRT',
        'JUPE': 'SKIRT',
        'MANTEAU DROIT': 'STRAIGHT COAT',
        'ROBE ESABEL': 'ESABEL DRESS',
        'TOP ESABEL': 'ESABEL TOP',
        'MANTEAU 3/4': '3/4 COAT',
        'MANTEAU LONG': 'LONG COAT',
        'VEST': 'VEST',
        'ROBE LONG': 'LONG DRESS',

        // Navigation
        'nav.cover': 'Cover',
        'nav.chemise': 'Shirt',
        'nav.pontalon': 'Pants',
        'nav.chemiseSansManche': 'Sleeveless Shirt',
        'nav.jupe': 'Skirt',
        'nav.manteauDroit': 'Straight Coat',
        'nav.robeEsabel': 'Isabelle Dress',
        'nav.topEsabel': 'Isabelle Top',
        'nav.manteau34': '3/4 Coat',
        'nav.manteauLong': 'Long Coat',
        'nav.vest': 'Vest',
        'nav.robeLong': 'Long Dress',
        'nav.orderSummary': 'Order Summary',
        'nav.placeOrder': 'Place Order',
        'nav.jumpTo': 'JUMP TO',

        // Page Headers
        'header.patterns': 'Patterns',
        'patterns': 'Patterns',

        // Order Summary
        'summary.noItems': 'No items selected',
        'summary.total': 'TOTAL',
        'summary.units': 'UNITS',

        // Order Form
        'form.businessInfo': 'BUSINESS INFORMATION',
        'form.companyName': 'COMPANY NAME *',
        'form.contactPerson': 'CONTACT PERSON *',
        'form.taxId': 'TAX ID / VAT NUMBER',
        'form.fullName': 'FULL NAME',
        'form.company': 'COMPANY',
        'form.email': 'EMAIL *',
        'form.phone': 'PHONE *',
        'form.shippingAddress': 'SHIPPING ADDRESS',
        'form.streetAddress': 'STREET ADDRESS *',
        'form.city': 'CITY *',
        'form.state': 'STATE / PROVINCE',
        'form.postalCode': 'POSTAL CODE *',
        'form.country': 'COUNTRY *',
        'form.address': 'ADDRESS',
        'form.deliveryPreferences': 'DELIVERY PREFERENCES',
        'form.deliveryDate': 'PREFERRED DELIVERY DATE',
        'form.shippingMethod': 'SHIPPING METHOD',
        'form.standard': 'Standard Shipping',
        'form.express': 'Express Shipping',
        'form.freight': 'Freight',
        'form.notes': 'ADDITIONAL NOTES / SPECIAL INSTRUCTIONS',
        'form.submit': 'SUBMIT ORDER',

        // Messages
        'msg.fillRequired': 'Please fill in Name, Email, and Phone.',
        'msg.selectFabric': 'Please select at least one fabric.',
        'msg.orderSuccess': 'Order submitted successfully! You can view it in the admin panel.',

        // Admin
        'admin.panel': 'Admin Panel'
    },
    fr: {
        // Product Names
        'CHEMISE': 'CHEMISE',
        'PONTALON': 'PONTALON',
        'SANT MANCH': 'CHEMISE SANS MANCHE',
        'JUPE': 'JUPE',
        'MANTEAU DROIT': 'MANTEAU DROIT',
        'ROBE ESABEL': 'ROBE ISABELLE',
        'TOP ESABEL': 'TOP ISABELLE',
        'MANTEAU 3/4': 'MANTEAU 3/4',
        'MANTEAU LONG': 'MANTEAU LONG',
        'VEST': 'GILET',
        'ROBE LONG': 'ROBE LONGUE',

        // Navigation
        'nav.cover': 'Couverture',
        'nav.chemise': 'Chemise',
        'nav.pontalon': 'Pontalon',
        'nav.chemiseSansManche': 'Chemise Sans Manche',
        'nav.jupe': 'Jupe',
        'nav.manteauDroit': 'Manteau Droit',
        'nav.robeEsabel': 'Robe Isabelle',
        'nav.topEsabel': 'Top Isabelle',
        'nav.manteau34': 'Manteau 3/4',
        'nav.manteauLong': 'Manteau Long',
        'nav.vest': 'Gilet',
        'nav.robeLong': 'Robe Longue',
        'nav.orderSummary': 'Résumé de Commande',
        'nav.placeOrder': 'Passer Commande',
        'nav.jumpTo': 'ALLER À',

        // Page Headers
        'header.patterns': 'Motifs',
        'patterns': 'Motifs',

        // Order Summary
        'summary.noItems': 'Aucun article sélectionné',
        'summary.total': 'TOTAL',
        'summary.units': 'UNITÉS',

        // Order Form
        'form.businessInfo': 'INFORMATIONS COMMERCIALES',
        'form.companyName': 'NOM DE L\'ENTREPRISE *',
        'form.contactPerson': 'PERSONNE DE CONTACT *',
        'form.taxId': 'NUMÉRO DE TVA / SIRET',
        'form.fullName': 'NOM COMPLET',
        'form.company': 'ENTREPRISE',
        'form.email': 'EMAIL *',
        'form.phone': 'TÉLÉPHONE *',
        'form.shippingAddress': 'ADRESSE DE LIVRAISON',
        'form.streetAddress': 'ADRESSE *',
        'form.city': 'VILLE *',
        'form.state': 'RÉGION / PROVINCE',
        'form.postalCode': 'CODE POSTAL *',
        'form.country': 'PAYS *',
        'form.address': 'ADRESSE',
        'form.deliveryPreferences': 'PRÉFÉRENCES DE LIVRAISON',
        'form.deliveryDate': 'DATE DE LIVRAISON SOUHAITÉE',
        'form.shippingMethod': 'MODE DE LIVRAISON',
        'form.standard': 'Livraison Standard',
        'form.express': 'Livraison Express',
        'form.freight': 'Fret',
        'form.notes': 'NOTES SUPPLÉMENTAIRES / INSTRUCTIONS SPÉCIALES',
        'form.submit': 'ENVOYER LA COMMANDE',

        // Messages
        'msg.fillRequired': 'Veuillez remplir le nom, l\'email et le téléphone.',
        'msg.selectFabric': 'Veuillez sélectionner au moins un tissu.',
        'msg.orderSuccess': 'Commande soumise avec succès! Vous pouvez la voir dans le panneau d\'administration.',

        // Admin
        'admin.panel': 'Panneau d\'Administration'
    }
};

// Current language - always English
let currentLanguage = 'en';

// Get translation
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Update all translations on the page
function updatePageTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // Update elements with data-i18n-pattern (for pattern counts)
    document.querySelectorAll('[data-i18n-pattern]').forEach(element => {
        const count = element.getAttribute('data-i18n-pattern');
        element.textContent = `${count} ${t('patterns')}`;
    });

    // Update elements with data-i18n-pattern-range (for pattern ranges like "Patterns 1 - 12")
    document.querySelectorAll('[data-i18n-pattern-range]').forEach(element => {
        const range = element.getAttribute('data-i18n-pattern-range');
        element.textContent = `${t('patterns')} ${range}`;
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePageTranslations();
});
