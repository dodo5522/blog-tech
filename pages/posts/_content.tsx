import React, { ReactElement } from 'react';
import { TinaMarkdown, TinaMarkdownContent } from 'tinacms/dist/rich-text';

const PageSection: React.FC<{ heading: string; content: string }> = ({ heading, content }): ReactElement => (
  <>
    <h2>{heading}</h2>
    <p>{content}</p>
  </>
);

const components = {
  pageSection: PageSection,
};

const ContentSection: React.FC<{ content: TinaMarkdownContent | TinaMarkdownContent[] }> = ({ content }): ReactElement => (
  <div className='relative py-16 bg-white overflow-hidden text-black'>
    <div className='hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full'>
      <div
        className='relative h-full text-lg max-w-prose mx-auto'
        aria-hidden='true'
      >
        <svg
          className='absolute top-12 left-full transform translate-x-32'
          width={404}
          height={384}
          fill='none'
          viewBox='0 0 404 384'
        >
          <defs>
            <pattern
              id='74b3fd99-0a6f-4271-bef2-e80eeafdf357'
              x={0}
              y={0}
              width={20}
              height={20}
              patternUnits='userSpaceOnUse'
            >
              <rect
                x={0}
                y={0}
                width={4}
                height={4}
                className='text-gray-200'
                fill='currentColor'
              />
            </pattern>
          </defs>
          <rect
            width={404}
            height={384}
            fill='url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)'
          />
        </svg>
        <svg
          className='absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32'
          width={404}
          height={384}
          fill='none'
          viewBox='0 0 404 384'
        >
          <defs>
            <pattern
              id='f210dbf6-a58d-4871-961e-36d5016a0f49'
              x={0}
              y={0}
              width={20}
              height={20}
              patternUnits='userSpaceOnUse'
            >
              <rect
                x={0}
                y={0}
                width={4}
                height={4}
                className='text-gray-200'
                fill='currentColor'
              />
            </pattern>
          </defs>
          <rect
            width={404}
            height={384}
            fill='url(#f210dbf6-a58d-4871-961e-36d5016a0f49)'
          />
        </svg>
        <svg
          className='absolute bottom-12 left-full transform translate-x-32'
          width={404}
          height={384}
          fill='none'
          viewBox='0 0 404 384'
        >
          <defs>
            <pattern
              id='d3eb07ae-5182-43e6-857d-35c643af9034'
              x={0}
              y={0}
              width={20}
              height={20}
              patternUnits='userSpaceOnUse'
            >
              <rect
                x={0}
                y={0}
                width={4}
                height={4}
                className='text-gray-200'
                fill='currentColor'
              />
            </pattern>
          </defs>
          <rect
            width={404}
            height={384}
            fill='url(#d3eb07ae-5182-43e6-857d-35c643af9034)'
          />
        </svg>
      </div>
    </div>
    <div className='relative px-4 sm:px-6 lg:px-8'>
      <div className='text-lg max-w-prose mx-auto'>
        <TinaMarkdown components={components} content={content} />
      </div>
    </div>
  </div>
);

export default ContentSection;
