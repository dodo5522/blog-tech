import React, { ReactElement } from 'react';
import { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useTina } from 'tinacms/dist/react';

import PostHeader from 'components/PostHeader';
import { client } from 'tina/__generated__/client';

export const getStaticPaths = async () => {
  const authorsList = await client.queries.authorConnection();
  return {
    paths: authorsList.data.authorConnection.edges?.map((author) => ({
      params: { filename: author?.node?._sys.filename },
    })),
    fallback: false,
  };
};

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const tinaProps = await client.queries.author({ relativePath: `${params?.filename}.mdx` });
  return {
    props: { ...tinaProps },
  };
};

const ReadingPage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = (props): ReactElement => {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });
  const { author } = data;

  return (
    <>
      <PostHeader
        title={author.name}
        tag=''
        date={dayjs(author.date).format('DD MMMM , YYYY')}
        authorName={author.name}
      />

      <div className='my-10 mx-auto'>
        {author.image
          ? (
            <Image
              height='250'
              width='500'
              src={author.image}
              alt={author.name}
              className='mx-auto h-[20%] w-[1424px]'
            />
          )
          : <div className='mx-auto'>No Image</div>}
      </div>

      <div className='my-12 prose prose-stone lg:prose-lg mx-auto'>
        <h1 className='text-3xl m-8 text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl'>
          {author.name}
        </h1>
      </div>
    </>
  );
};

export default ReadingPage;
