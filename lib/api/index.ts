// Channels API
export { channelsApi, ChannelsApiError } from './channels-api';

// Contracts API
export { contractsApi, ContractsApiError } from './contracts-api';

// Posts API
export { postsApi, PostsApiError } from './posts-api';

// Re-export types
export type {
  ChannelsListResponse,
  ChannelConnectionResponse,
  ChannelAnalytics,
  ChannelError
} from '@/types/channel-ui';

export type {
  ContractsApiResponse,
  ContractApiResponse,
  ContractUploadResponse,
  ContractStatsResponse,
  CreateContractData,
  UpdateContractData,
  ContractUploadMetadata,
  ContractError
} from '@/types/contract-ui';

export type {
  PostsApiResponse,
  PostApiResponse,
  PostStatsResponse,
  MediaUploadResponse,
  PostPreview,
  PostSearchOptions,
  CreatePostData,
  UpdatePostData
} from '@/types/post-ui'; 