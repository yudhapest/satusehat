import { createClientCredentialsTokenProvider } from "./auth";
import { createFileTokenStore, createMemoryTokenStore } from "./token-store";
import { createTransport } from "./transport";
import { createAllergyIntoleranceClient } from "../endpoints/allergy-intolerance";
import { createCarePlanClient } from "../endpoints/care-plan";
import { createClinicalImpressionClient } from "../endpoints/clinical-impression";
import { createCompositionClient } from "../endpoints/composition";
import { createConditionClient } from "../endpoints/condition";
import { createDicomRouterClient } from "../endpoints/dicom-router";
import { createDiagnosticReportClient } from "../endpoints/diagnostic-report";
import { createEncounterClient } from "../endpoints/encounter";
import { createEpisodeOfCareClient } from "../endpoints/episode-of-care";
import { createFamilyMemberHistoryClient } from "../endpoints/family-member-history";
import { createImagingStudyClient } from "../endpoints/imaging-study";
import { createImmunizationClient } from "../endpoints/immunization";
import { createLocationClient } from "../endpoints/location";
import { createMedicationAdministrationClient } from "../endpoints/medication-administration";
import { createMedicationDispenseClient } from "../endpoints/medication-dispense";
import { createMedicationClient } from "../endpoints/medication";
import { createMedicationRequestClient } from "../endpoints/medication-request";
import { createMedicationStatementClient } from "../endpoints/medication-statement";
import { createNutritionOrderClient } from "../endpoints/nutrition-order";
import { createObservationClient } from "../endpoints/observation";
import { createOrganizationClient } from "../endpoints/organization";
import { createPatientClient } from "../endpoints/patient";
import { createPractitionerClient } from "../endpoints/practitioner";
import { createPractitionerRoleClient } from "../endpoints/practitioner-role";
import { createProcedureClient } from "../endpoints/procedure";
import { createQuestionnaireResponseClient } from "../endpoints/questionnaire-response";
import { createRiskAssessmentClient } from "../endpoints/risk-assessment";
import { createServiceRequestClient } from "../endpoints/service-request";
import { createSpecimenClient } from "../endpoints/specimen";
import { SatuSehatConfigError } from "../core/errors";
import {
  type AccessTokenProvider,
  type SatuSehatClient,
  type SatuSehatClientConfig,
  type SatuSehatEnvironment,
  type SatuSehatEnvSource,
} from "../core/types";

const DEFAULT_BASE_URLS: Record<SatuSehatEnvironment, string> = {
  sandbox: "https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1",
  production: "https://api-satusehat.kemkes.go.id/fhir-r4/v1",
};

const DEFAULT_AUTH_BASE_URLS: Record<SatuSehatEnvironment, string> = {
  sandbox: "https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1",
  production: "https://api-satusehat.kemkes.go.id/oauth2/v1",
};

const DEFAULT_DICOM_BASE_URLS: Record<SatuSehatEnvironment, string> = {
  sandbox: "https://api-satusehat-stg.dto.kemkes.go.id",
  production: "https://api-satusehat.kemkes.go.id",
};

export function createSatuSehatClient(config: SatuSehatClientConfig = {}): SatuSehatClient {
  const environment = config.environment ?? "sandbox";
  const baseUrl = config.baseUrl ?? resolveSatuSehatBaseUrl(environment);
  const authBaseUrl = config.authBaseUrl ?? resolveSatuSehatAuthBaseUrl(environment);
  const dicomBaseUrl = config.dicomBaseUrl ?? resolveSatuSehatDicomBaseUrl(environment);
  const authStrategy = resolveClientAccessToken(config, authBaseUrl);
  const transport = createTransport({
    baseUrl,
    ...(authStrategy?.accessToken ? { accessToken: authStrategy.accessToken } : {}),
    ...(authStrategy?.invalidateAccessToken
      ? { invalidateAccessToken: authStrategy.invalidateAccessToken }
      : {}),
    ...(config.retryOnUnauthorized !== undefined
      ? { retryOnUnauthorized: config.retryOnUnauthorized }
      : {}),
    ...(config.defaultHeaders ? { defaultHeaders: config.defaultHeaders } : {}),
    ...(config.fetch ? { fetch: config.fetch } : {}),
    ...(config.validateResponse !== undefined
      ? { validateResponse: config.validateResponse }
      : {}),
  });
  const dicomTransport = createTransport({
    baseUrl: dicomBaseUrl,
    ...(authStrategy?.accessToken ? { accessToken: authStrategy.accessToken } : {}),
    ...(authStrategy?.invalidateAccessToken
      ? { invalidateAccessToken: authStrategy.invalidateAccessToken }
      : {}),
    ...(config.retryOnUnauthorized !== undefined
      ? { retryOnUnauthorized: config.retryOnUnauthorized }
      : {}),
    ...(config.defaultHeaders ? { defaultHeaders: config.defaultHeaders } : {}),
    ...(config.fetch ? { fetch: config.fetch } : {}),
    ...(config.validateResponse !== undefined
      ? { validateResponse: config.validateResponse }
      : {}),
  });

  return {
    allergyIntolerance: createAllergyIntoleranceClient(transport),
    carePlan: createCarePlanClient(transport),
    clinicalImpression: createClinicalImpressionClient(transport),
    composition: createCompositionClient(transport),
    condition: createConditionClient(transport),
    dicomRouter: createDicomRouterClient(dicomTransport),
    diagnosticReport: createDiagnosticReportClient(transport),
    encounter: createEncounterClient(transport),
    episodeOfCare: createEpisodeOfCareClient(transport),
    familyMemberHistory: createFamilyMemberHistoryClient(transport),
    imagingStudy: createImagingStudyClient(transport),
    immunization: createImmunizationClient(transport),
    location: createLocationClient(transport),
    medicationAdministration: createMedicationAdministrationClient(transport),
    medicationDispense: createMedicationDispenseClient(transport),
    medication: createMedicationClient(transport),
    medicationRequest: createMedicationRequestClient(transport),
    medicationStatement: createMedicationStatementClient(transport),
    nutritionOrder: createNutritionOrderClient(transport),
    observation: createObservationClient(transport),
    organization: createOrganizationClient(transport),
    patient: createPatientClient(transport),
    practitioner: createPractitionerClient(transport),
    practitionerRole: createPractitionerRoleClient(transport),
    procedure: createProcedureClient(transport),
    questionnaireResponse: createQuestionnaireResponseClient(transport),
    riskAssessment: createRiskAssessmentClient(transport),
    serviceRequest: createServiceRequestClient(transport),
    specimen: createSpecimenClient(transport),
  };
}

export function createSatuSehatClientFromEnv(
  env: SatuSehatEnvSource = process.env as SatuSehatEnvSource,
  overrides: Omit<SatuSehatClientConfig, "environment" | "baseUrl" | "authBaseUrl" | "credentials"> = {},
): SatuSehatClient {
  const environment = parseEnvironment(env.SATUSEHAT_ENV);

  return createSatuSehatClient({
    ...(environment ? { environment } : {}),
    ...(env.SATUSEHAT_BASE_URL ? { baseUrl: env.SATUSEHAT_BASE_URL } : {}),
    ...(env.SATUSEHAT_AUTH_BASE_URL ? { authBaseUrl: env.SATUSEHAT_AUTH_BASE_URL } : {}),
    ...(env.SATUSEHAT_DICOM_BASE_URL ? { dicomBaseUrl: env.SATUSEHAT_DICOM_BASE_URL } : {}),
    ...(env.SATUSEHAT_CLIENT_ID && env.SATUSEHAT_CLIENT_SECRET
      ? {
          credentials: {
            clientId: env.SATUSEHAT_CLIENT_ID,
            clientSecret: env.SATUSEHAT_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.SATUSEHAT_TOKEN_CACHE_FILE
      ? {
          tokenStore: createFileTokenStore({
            filePath: env.SATUSEHAT_TOKEN_CACHE_FILE,
          }),
        }
      : {}),
    ...overrides,
  });
}

export function resolveSatuSehatBaseUrl(environment: SatuSehatEnvironment): string {
  return DEFAULT_BASE_URLS[environment];
}

export function resolveSatuSehatAuthBaseUrl(environment: SatuSehatEnvironment): string {
  return DEFAULT_AUTH_BASE_URLS[environment];
}

export function resolveSatuSehatDicomBaseUrl(environment: SatuSehatEnvironment): string {
  return DEFAULT_DICOM_BASE_URLS[environment];
}

function resolveClientAccessToken(
  config: SatuSehatClientConfig,
  authBaseUrl: string,
): {
  accessToken?: AccessTokenProvider;
  invalidateAccessToken?: () => Promise<void>;
} | undefined {
  if (config.accessToken) {
    return {
      accessToken: config.accessToken,
    };
  }

  if (!config.credentials) {
    return undefined;
  }

  if (!config.credentials.clientId || !config.credentials.clientSecret) {
    throw new SatuSehatConfigError("SATUSEHAT credentials must include clientId and clientSecret");
  }

  const tokenStore = config.tokenStore ?? createMemoryTokenStore();
  const accessToken = createClientCredentialsTokenProvider({
    authBaseUrl,
    clientId: config.credentials.clientId,
    clientSecret: config.credentials.clientSecret,
    tokenStore,
    ...(config.tokenExpiryWindowMs !== undefined
      ? { tokenExpiryWindowMs: config.tokenExpiryWindowMs }
      : {}),
    ...(config.fetch ? { fetch: config.fetch } : {}),
  });

  return {
    accessToken,
    ...(tokenStore.clearToken
      ? {
          invalidateAccessToken: async () => {
            await tokenStore.clearToken?.();
          },
        }
      : {}),
  };
}

function parseEnvironment(input?: string): SatuSehatEnvironment | undefined {
  if (!input) {
    return undefined;
  }

  if (input === "sandbox" || input === "production") {
    return input;
  }

  throw new SatuSehatConfigError(
    `Invalid SATUSEHAT_ENV value "${input}". Expected "sandbox" or "production".`,
  );
}
