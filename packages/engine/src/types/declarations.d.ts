// Type declarations for modules that don't have proper TypeScript definitions
// This file helps resolve TypeScript compilation errors

declare module 'helmet' {
  import { RequestHandler } from 'express';
  
  interface HelmetOptions {
    contentSecurityPolicy?: any;
    crossOriginEmbedderPolicy?: any;
    crossOriginOpenerPolicy?: any;
    crossOriginResourcePolicy?: any;
    dnsPrefetchControl?: any;
    frameguard?: any;
    hidePoweredBy?: any;
    hsts?: any;
    ieNoOpen?: any;
    noSniff?: any;
    originAgentCluster?: any;
    permittedCrossDomainPolicies?: any;
    referrerPolicy?: any;
    xssFilter?: any;
  }
  
  function helmet(options?: HelmetOptions): RequestHandler;
  export = helmet;
}

declare module 'joi' {
  export interface ValidationResult<T = any> {
    error?: ValidationError;
    value: T;
    then?: never;
    catch?: never;
  }
  
  export interface ValidationError extends Error {
    details: ValidationErrorItem[];
    annotate(): string;
  }
  
  export interface ValidationErrorItem {
    message: string;
    path: (string | number)[];
    type: string;
    context?: any;
  }
  
  export interface Schema<T = any> {
    validate(value: any, options?: ValidationOptions): ValidationResult<T>;
    required(): this;
    optional(): this;
  }
  
  export interface ValidationOptions {
    allowUnknown?: boolean;
    abortEarly?: boolean;
    stripUnknown?: boolean;
  }
  
  export interface StringSchema extends Schema<string> {
    valid(...values: string[]): this;
  }
  
  export interface ObjectSchema extends Schema<object> {
    // Add object schema methods as needed
  }
  
  export function object(schema?: Record<string, Schema>): ObjectSchema;
  export function string(): StringSchema;
  export function array(): Schema<any[]>;
  export function number(): Schema<number>;
  export function boolean(): Schema<boolean>;
  export function date(): Schema<Date>;
  export function any(): Schema<any>;
}

declare module 'node-cache' {
  export interface Options {
    stdTTL?: number;
    checkperiod?: number;
    useClones?: boolean;
    deleteOnExpire?: boolean;
    enableLegacyCallbacks?: boolean;
    maxKeys?: number;
  }
  
  export default class NodeCache {
    constructor(options?: Options);
    
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): boolean;
    del(key: string | string[]): number;
    clear(): void;
    has(key: string): boolean;
    keys(): string[];
    getStats(): {
      keys: number;
      hits: number;
      misses: number;
      ksize: number;
      vsize: number;
    };
  }
}
