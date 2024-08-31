import React, { ReactElement } from 'react';
import { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useTina } from 'tinacms/dist/react';

import PostHeader from 'components/PostHeader';
import { client } from 'tina/__generated__/client';

import ContentSection from './_content';
import AnotherPosts from './_anotherPosts';

export const getStaticPaths = async () => {
  const postsList = await client.queries.postConnection();
  return {
    paths: postsList.data.postConnection.edges?.map((post) => ({
      params: { filename: post?.node?._sys.filename },
    })),
    fallback: false,
  };
};

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const tinaProps = await client.queries.post({ relativePath: `${params?.filename}.mdx` });
  return {
    props: { ...tinaProps, posts: [] },
  };
};

const ReadingPage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = (props): ReactElement => {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });
  const { post } = data;

  return (
    post
      ? (
        <>
          <PostHeader
            title={post.title}
            tag={post.tags?.[0] ?? ''}
            date={dayjs(post.date).format('DD MMMM , YYYY')}
            authorName={post.author}
          />
          <div className='my-10 mx-auto'>
            {post.image
              ? (
                <Image
                  height='250'
                  width='500'
                  src={post.image}
                  alt={post.title}
                  className='mx-auto h-[20%] w-[1424px]'
                />
              ) : <>No Image</>}
          </div>

          <div className='my-12 prose prose-stone lg:prose-lg mx-auto'>
            <h1 className='text-3xl m-8 text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl'>
              {post.title}
            </h1>
            <ContentSection content={post._body} />
          </div>
          <AnotherPosts posts={props?.posts ?? []} />
        </>
      )
      : <>No Data</>
  );
};

export default ReadingPage;
