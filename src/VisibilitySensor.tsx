import React, { useEffect } from 'react';
import { IntersectionOptions, useInView } from 'react-intersection-observer';

type Props = IntersectionOptions & {
  onChange(visible: boolean): void;
};

const VisibilitySensor: React.FC<Props> = props => {
  const { onChange, ...options } = props;
  const { ref, inView } = useInView(options);

  useEffect(() => {
    onChange(inView);
  }, [onChange, inView]);

  useEffect(() => {
    return () => {
      onChange(false);
    };
  }, []);

  return <div ref={ref}>{props.children}</div>;
};

export default VisibilitySensor;
