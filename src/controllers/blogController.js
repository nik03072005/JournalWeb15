
import { connectToDatabase } from '@/lib/db';
import Blog from '../models/blogModel';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create a new blog
export const createBlog = async (body) => {
    await connectToDatabase()
  try {
    const { title, content, bannerImage } = body;

    if (!title || !content || !bannerImage) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return new Response(JSON.stringify({ error: 'Slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new blog
    const blog = new Blog({
      title,
      content,
      bannerImage,
      slug,
    });

    await blog.save();
    return new Response(JSON.stringify({ message: 'Blog created successfully', blog }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error creating blog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Upload image
export const uploadImage = async (formData) => {
    await connectToDatabase();
  try {
    const file = formData.get('image');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No image uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Only JPEG or PNG images are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `blog_images/${fileName}`,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(params));

    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/blog_images/${fileName}`;

    return new Response(JSON.stringify({ message: 'Image uploaded successfully', fileName, url: s3Url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Get blogs (by slug or all)
export const getBlogs = async (slug = null) => {
    await connectToDatabase();
  try {
    if (slug) {
      const blog = await Blog.findOne({ slug });
      if (!blog) {
        return new Response(JSON.stringify({ success: false, message: 'Blog not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, blog }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const blogs = await Blog.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify({ success: true, blogs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Update a blog
export const updateBlog = async (slug, body) => {
    await connectToDatabase();
  try {
    const { title, content, bannerImage } = body;

    if (!title || !content || !bannerImage) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new slug from title
    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if new slug is unique (excluding current blog)
    // const existingBlog = await Blog.findOne({ slug: newSlug, slug: { $ne: slug } });
    // if (existingBlog) {
    //   return new Response(JSON.stringify({ error: 'Slug already exists' }), {
    //     status: 400,
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }

    const blog = await Blog.findOneAndUpdate(
      { slug },
      { title, content, bannerImage, slug: newSlug },
      { new: true }
    ).select('-createdAt -updatedAt -__v');

    if (!blog) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Blog updated successfully', blog }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Delete a blog
export const deleteBlog = async (slug) => {
    await connectToDatabase();
  try {
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Blog slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const blog = await Blog.findOneAndDelete({ slug });

    if (!blog) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Blog deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};