import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

export function IsStringOrNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value === 'string') return value.trim().length > 0;
          if (typeof value === 'number') return Number.isFinite(value);
          return false;
        },
      },
    });
  };
}

export function AtLeastOneOf(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_value: unknown, args?: ValidationArguments) {
          if (!args) return false;
          const [props] = args.constraints as [string[]];
          const obj = args.object as Record<string, unknown>;
          return props.some((p) => obj[p] !== undefined && obj[p] !== null);
        },
      },
    });
  };
}
