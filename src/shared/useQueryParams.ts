import { useSyncExternalStore } from 'react';
import type { ErrorCorrectionLevel } from './types';

interface QueryParams {
  data: string;
  version: string;
  error: ErrorCorrectionLevel;
}

type QueryParamsUpdater = (params: Partial<QueryParams>) => void;

// URL 파라미터 관리를 위한 스토어
class QueryParamsStore {
  private listeners = new Set<() => void>();
  private currentParams: QueryParams;
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.currentParams = this.parseFromURL();
    
    // 클라이언트 환경에서만 popstate 이벤트 리스너 등록
    if (this.isClient) {
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  private handlePopState = () => {
    this.currentParams = this.parseFromURL();
    this.notifyListeners();
  };

  private parseFromURL(): QueryParams {
    if (!this.isClient) {
      // 서버 환경에서는 기본값 반환
      return {
        data: '',
        version: '1',
        error: 'M'
      };
    }
    
    const params = new URLSearchParams(window.location.search);
    return {
      data: params.get('data') || '',
      version: params.get('version') || '1',
      error: (params.get('error') as ErrorCorrectionLevel) || 'M'
    };
  }

  private updateURL(params: QueryParams) {
    if (!this.isClient) return;
    
    const urlParams = new URLSearchParams();
    
    // 기본값이 아닌 경우에만 URL에 포함
    if (params.data) urlParams.set('data', params.data);
    if (params.version !== '1') urlParams.set('version', params.version);
    if (params.error !== 'M') urlParams.set('error', params.error);
    
    const queryString = urlParams.toString();
    const newUrl = queryString 
      ? `${window.location.pathname}?${queryString}` 
      : window.location.pathname;
    
    // 현재 URL과 다른 경우에만 업데이트
    if (newUrl !== window.location.href) {
      window.history.replaceState({}, '', newUrl);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): QueryParams => {
    return this.currentParams;
  };

  updateParams = (updates: Partial<QueryParams>) => {
    const newParams = { ...this.currentParams, ...updates };
    this.currentParams = newParams;
    this.updateURL(newParams);
    this.notifyListeners();
  };

  // 클린업
  destroy() {
    if (this.isClient) {
      window.removeEventListener('popstate', this.handlePopState);
    }
    this.listeners.clear();
  }
}

// 싱글톤 인스턴스 (지연 초기화)
let queryParamsStore: QueryParamsStore | null = null;

function getQueryParamsStore(): QueryParamsStore {
  if (!queryParamsStore) {
    queryParamsStore = new QueryParamsStore();
  }
  return queryParamsStore;
}

/**
 * URL 쿼리 파라미터와 React 상태를 동기화하는 훅
 * 
 * @returns [params, updateParams] - 현재 파라미터 값과 업데이트 함수
 */
export function useQueryParams(): [QueryParams, QueryParamsUpdater] {
  const store = getQueryParamsStore();
  
  const params = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );

  return [params, store.updateParams];
}

// 개별 파라미터 접근을 위한 유틸리티 훅들
export function useQueryParam<K extends keyof QueryParams>(
  key: K
): [QueryParams[K], (value: QueryParams[K]) => void] {
  const [params, updateParams] = useQueryParams();
  
  const updateParam = (value: QueryParams[K]) => {
    updateParams({ [key]: value } as Partial<QueryParams>);
  };

  return [params[key], updateParam];
}

// 클린업 함수 export (필요시 사용)
export const destroyQueryParamsStore = () => {
  if (queryParamsStore) {
    queryParamsStore.destroy();
    queryParamsStore = null;
  }
};