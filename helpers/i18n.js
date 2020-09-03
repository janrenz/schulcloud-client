const i18next = require('i18next');
const Backend = require('i18next-sync-fs-backend');
const path = require('path');
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');
const api = require('../api');

const i18nDebug = Configuration.get('I18N__DEBUG');
const fallbackLanguage = Configuration.get('I18N__FALLBACK_LANGUAGE');
const language = Configuration.get('I18N__DEFAULT_LANGUAGE');
const availableLanuages = (Configuration.get('I18N__AVAILABLE_LANGUAGES') || '').split(',').map((value) => value.trim());

const localeDir = path.join(__dirname, '../locales');

i18next
	.use(Backend)
	.init({
		debug: i18nDebug,
		initImmediate: false,
		lng: language,
		fallbackLng: fallbackLanguage,
		supportedLngs: availableLanuages || false,
		backend: {
			loadPath: `${localeDir}/{{lng}}.json`,
		},
	})
	.then(() => {
		logger.info('i18n initialized');
	})
	.catch(logger.error);

const getSchoolLanguage = async (req, schoolId) => {
	try {
		const school = await api(req).get(`/registrationSchool/${schoolId}`);
		return school.language;
	} catch (e) {
		return undefined;
	}
};

const getCurrentLanguage = async (req, res) => {
	// get language by query
	if (req && req.query && req.query.lng) {
		return req.query.lng;
	}

	const { currentUser, currentSchoolData } = (res || {}).locals;

	// get language by user
	if (currentUser && currentUser.language) {
		return currentUser.language;
	}

	// get language by school
	if (currentSchoolData && currentSchoolData.language) {
		return currentSchoolData.language;
	}

	// get language by cookie
	if (req && req.cookies && req.cookies.USER_LANG) {
		return req.cookies.USER_LANG;
	}

	// get language by registration school
	if (req.url.startsWith('/registration/')) {
		const matchSchoolId = req.url.match('/registration/(.*)\\?');
		return matchSchoolId.length > 1 ? getSchoolLanguage(req, matchSchoolId[1]) : undefined;
	}

	return null;
};

const getInstance = () => (key, options = {}) => i18next.t(key, {
	...options,
});

const changeLanguage = (lng) => {
	if (availableLanuages.includes(lng)) {
		return i18next.changeLanguage(lng);
	}
	return false;
};

module.exports = {
	language,
	availableLanuages,
	getInstance,
	changeLanguage,
	getCurrentLanguage,
};
