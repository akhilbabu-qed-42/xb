import type { PropsValues } from '@/types/Form';
import type { FieldDataItem } from '@/types/Component';

export interface TransformOptions {
  [key: string]: any;
}

export type Transform = {
  [key in keyof Transforms]: TransformOptions;
};

export interface TransformConfig {
  [key: keyof PropsValues]: Partial<Transform>;
}

type PropsValuesOrArrayOfPropsValues = Array<PropsValues> | PropsValues;

type Transformer<
  TransformerOptions extends any,
  TransformerReturn extends unknown = any,
  TransformerInput extends unknown = PropsValuesOrArrayOfPropsValues,
  FieldDataShape extends FieldDataItem = FieldDataItem,
> = (
  value: TransformerInput,
  options: TransformerOptions,
  fieldData: FieldDataShape,
) => TransformerReturn;

const isList = (
  props: PropsValues | Array<PropsValues>,
  list: boolean,
): props is Array<PropsValues> => list;

const mainProperty: Transformer<{
  name?: keyof PropsValues;
  list?: boolean;
}> = (value, options): any => {
  if (value === null) {
    return null;
  }
  const { name = 'value', list = true } = options;
  let first = value as PropsValues;
  if (isList(value, list)) {
    if (value.length === 0) {
      return null;
    }
    first = value.shift() as PropsValues;
  }
  if (first && name in first) {
    return first[name];
  }
  return null;
};

const firstRecord: Transformer<void, null | PropsValues> = (value) => {
  if (value === null || value.length === 0) {
    return null;
  }
  return value.pop() as PropsValues;
};

interface LinkFieldData extends FieldDataItem {
  sourceTypeSettings: {
    instance: {
      // @see DRUPAL_DISABLED
      // @see DRUPAL_OPTIONAL
      // @see DRUPAL_REQUIRED
      title: 0 | 1 | 2;
    };
  };
}

const link: Transformer<
  void,
  null | string | PropsValues,
  PropsValuesOrArrayOfPropsValues,
  LinkFieldData
> = (value, options, fieldData) => {
  // `0` corresponds to `DRUPAL_DISABLED` on the server side.
  if (fieldData.sourceTypeSettings.instance.title === 0) {
    return mainProperty(value, { name: 'uri' }, fieldData);
  }
  return firstRecord(value, undefined, fieldData);
};

const cast: Transformer<
  { to: 'number' | 'boolean' | 'integer' },
  null | number | boolean,
  null | string
> = (value, options) => {
  const { to = 'number' } = options;
  if (value === null) {
    return null;
  }
  if (to === 'number') {
    return Number(value);
  }
  if (to === 'integer') {
    return parseInt(value);
  }
  if (value === 'false') {
    return false;
  }
  return Boolean(value);
};

interface DateFieldData extends FieldDataItem {
  sourceTypeSettings: {
    storage: {
      // @see \Drupal\datetime\Plugin\Field\FieldType\DateTimeItem::DATETIME_TYPE_DATE
      // @see \Drupal\datetime\Plugin\Field\FieldType\DateTimeItem::DATETIME_TYPE_DATETIME
      datetime_type: 'date' | 'datetime';
    };
  };
}

const dateTime: Transformer<
  { type: 'date' | 'datetime' },
  null | string,
  PropsValuesOrArrayOfPropsValues,
  DateFieldData
> = (value, options, fieldData) => {
  const type = fieldData.sourceTypeSettings.storage.datetime_type;
  // @see \Drupal\Component\Datetime\DateTimePlus::setDefaultDateTime
  let timeString = '12:00:00';
  if (!('date' in value)) {
    return null;
  }
  const dateString = value.date;
  if (type === 'date') {
    return dateString;
  }
  if ('time' in value) {
    timeString = value.time;
  }
  // @todo Update this in https://www.drupal.org/project/experience_builder/issues/3501281, which will allow removing the FE-special casing in \Drupal\experience_builder\PropExpressions\StructuredData\Evaluator::evaluate()
  return new Date(`${dateString} ${timeString}+0000`).toISOString();
};

const mediaSelection: Transformer<void, null | PropsValues> = (value) => {
  if ('selection' in value) {
    return value.selection;
  }
  return null;
};

const transforms = {
  mainProperty,
  firstRecord,
  dateTime,
  mediaSelection,
  cast,
  link,
};

export type Transforms = typeof transforms;

export default transforms;
