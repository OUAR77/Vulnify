import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
from models.blog_post import BlogPost
from models.user import User
from modules.auth import require_admin_totp
from config import limiter

router = APIRouter(prefix="/api/blog", tags=["Blog"])
logger = logging.getLogger("vulnify.api.blog")


@router.get("/", description="List published blog posts")
@limiter.limit("30/minute")
def list_posts(
    request: Request,
    db: Session = Depends(get_db),
):
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.published == True)
        .order_by(BlogPost.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "tag": p.tag,
            "excerpt": p.excerpt,
            "author": p.author,
            "read_time": p.read_time,
            "published": p.published,
            "created_at": str(p.created_at)[:19],
        }
        for p in posts
    ]


@router.get("/{slug}", description="Get a single blog post by slug")
@limiter.limit("30/minute")
def get_post(
    request: Request,
    slug: str,
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    return {
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "tag": post.tag,
        "excerpt": post.excerpt,
        "content": post.content,
        "author": post.author,
        "read_time": post.read_time,
        "published": post.published,
        "created_at": str(post.created_at)[:19],
        "updated_at": str(post.updated_at)[:19] if post.updated_at else None,
    }


@router.get("/admin/all", description="List all blog posts (admin only)")
@limiter.limit("30/minute")
def admin_list_all_posts(
    request: Request,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    posts = db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "tag": p.tag,
            "excerpt": p.excerpt,
            "author": p.author,
            "read_time": p.read_time,
            "published": p.published,
            "created_at": str(p.created_at)[:19],
            "updated_at": str(p.updated_at)[:19] if p.updated_at else None,
        }
        for p in posts
    ]


@router.post("/admin", description="Create a blog post (admin only)")
@limiter.limit("10/minute")
def admin_create_post(
    request: Request,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    slug = body.get("slug", "")
    if not slug:
        raise HTTPException(status_code=400, detail="Slug es requerido")
    existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un post con ese slug")
    post = BlogPost(
        title=body.get("title", ""),
        slug=slug,
        tag=body.get("tag", "General"),
        excerpt=body.get("excerpt", ""),
        content=body.get("content", ""),
        author=body.get("author", "Vulnify"),
        read_time=body.get("read_time", "5 min"),
        published=body.get("published", False),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"id": post.id, "slug": post.slug, "message": "Post creado"}


@router.put("/admin/{post_id}", description="Update a blog post (admin only)")
@limiter.limit("10/minute")
def admin_update_post(
    request: Request,
    post_id: int,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    if "title" in body:
        post.title = body["title"]
    if "slug" in body:
        new_slug = body["slug"]
        existing = db.query(BlogPost).filter(BlogPost.slug == new_slug, BlogPost.id != post_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un post con ese slug")
        post.slug = new_slug
    if "tag" in body:
        post.tag = body["tag"]
    if "excerpt" in body:
        post.excerpt = body["excerpt"]
    if "content" in body:
        post.content = body["content"]
    if "author" in body:
        post.author = body["author"]
    if "read_time" in body:
        post.read_time = body["read_time"]
    if "published" in body:
        post.published = body["published"]
    db.commit()
    db.refresh(post)
    return {"id": post.id, "slug": post.slug, "message": "Post actualizado"}


@router.delete("/admin/{post_id}", description="Delete a blog post (admin only)")
@limiter.limit("10/minute")
def admin_delete_post(
    request: Request,
    post_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    db.delete(post)
    db.commit()
    return {"ok": True}
