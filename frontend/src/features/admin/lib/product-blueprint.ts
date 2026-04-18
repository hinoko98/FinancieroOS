export type ProductBlueprintRole = {
  id: string;
  label: string;
  purpose: string;
  permissions: string[];
};

export type ProductBlueprintRoute = {
  method: string;
  path: string;
  summary: string;
};

export type ProductBlueprint = {
  updatedAt: string;
  country: string;
  product: {
    currentName: string;
    targetName: string;
    firstStageName: string;
    recommendation: string;
  };
  diagnostic: {
    summary: string;
    points: string[];
  };
  domainModel: {
    roles: ProductBlueprintRole[];
    boundedContexts: Array<{
      name: string;
      includes: string[];
    }>;
    entityDecisions: Array<{
      currentModel: string;
      action: string;
      proposedModel: string;
      reason: string;
    }>;
    transformationFlow: Array<{
      from: string;
      to: string;
      details: string[];
    }>;
  };
  mvp: {
    modules: Array<{
      id: string;
      name: string;
      scope: string;
    }>;
    deferredCapabilities: string[];
  };
  databaseChanges: {
    keep: string[];
    adapt: string[];
    replace: string[];
    create: string[];
  };
  backendChanges: {
    architecture: string[];
    initialRoutes: ProductBlueprintRoute[];
  };
  frontendChanges: {
    routes: string[];
    screens: string[];
    decisions: string[];
  };
  implementationOrder: string[];
  risks: {
    keepingTooMuchOfCurrentModel: string[];
    redesigningEverythingAtOnce: string[];
    recommendation: string;
  };
};

export const PRODUCT_BLUEPRINT_QUERY_KEY = ['product-blueprint'];
