/**
 * Calculate risk status based on days since last interaction
 * Business Logic: 
 * - High Risk: No interaction in 7+ days
 * - Medium Risk: No interaction in 3-6 days  
 * - Low Risk: Interaction within last 3 days
 * 
 * @param {string} lastInteractionDate - ISO date string
 * @returns {string} Risk level: 'high', 'medium', or 'low'
 */
function calculateRisk(lastInteractionDate) {
    if (!lastInteractionDate) {
        return 'high'; // No interaction data means high risk
    }

    const lastDate = new Date(lastInteractionDate);
    const now = new Date();
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (daysSince >= 7) {
        return 'high';
    } else if (daysSince >= 3) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Add risk status to a lead object
 * @param {Object} lead - Lead object
 * @returns {Object} Lead with risk field added
 */
function addRiskToLead(lead) {
    return {
        ...lead,
        risk: calculateRisk(lead.lastInteraction)
    };
}

module.exports = {
    calculateRisk,
    addRiskToLead
};
