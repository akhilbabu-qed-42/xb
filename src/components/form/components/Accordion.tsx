import clsx from 'clsx';
import * as Accordion from '@radix-ui/react-accordion';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';

import type { ReactNode } from 'react';
import type { Attributes } from '@/types/DrupalAttribute';

import styles from './AccordionAndDetails.module.css';

const AccordionRoot = ({
  attributes = {},
  children = null,
  value = [],
  onValueChange = () => {},
}: {
  attributes?: Attributes;
  children: ReactNode;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}) => (
  <Accordion.Root
    type="multiple"
    value={value}
    onValueChange={onValueChange}
    {...attributes}
  >
    {children}
  </Accordion.Root>
);

const AccordionDetails = ({
  value = '',
  title = null,
  children = null,
  attributes = {},
  summaryAttributes = {},
  onTriggerClick = () => {},
  className = '',
  triggerClassName = '',
}: {
  value?: string;
  title: ReactNode;
  children: ReactNode;
  attributes?: Attributes;
  summaryAttributes?: object;
  onTriggerClick?: () => void;
  className?: string;
  triggerClassName?: string;
}) => (
  <Accordion.Item
    value={value || (attributes.id as string)}
    className={clsx(attributes?.className, className)}
    {...attributes}
  >
    <Flex asChild justify="between" align="center" width="100%">
      <Accordion.Trigger
        className={clsx(styles.trigger, triggerClassName)}
        onClick={onTriggerClick}
      >
        <Text size="2" weight="medium" {...summaryAttributes}>
          {title}
        </Text>
        <ChevronRightIcon className={styles.chevron} aria-hidden />
      </Accordion.Trigger>
    </Flex>

    <Accordion.Content
      className={clsx(styles.content, styles.accordionContent)}
    >
      <Box pl="2">{children}</Box>
    </Accordion.Content>
  </Accordion.Item>
);

export { AccordionRoot, AccordionDetails };
