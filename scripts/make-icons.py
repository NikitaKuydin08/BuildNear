# Generates the app icons (placeholder brand mark: two people meeting). Re-run after changing the colours.
from PIL import Image, ImageDraw

BG = (11, 11, 15)
A = (242, 183, 5)    # yellow
B = (142, 92, 240)   # purple
S = 1024             # draw big, then shrink for clean edges

def mark(scale):
    im = Image.new("RGB", (S, S), BG)
    # transparent layer so the overlap can be blended
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = int(S * 0.22 * scale)
    cx, cy = S // 2, S // 2
    off = int(S * 0.14 * scale)
    d.ellipse((cx - off - r, cy - r, cx - off + r, cy + r), fill=A + (255,))
    layer2 = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(layer2)
    d2.ellipse((cx + off - r, cy - r, cx + off + r, cy + r), fill=B + (235,))
    im.paste(layer, (0, 0), layer)
    im.paste(layer2, (0, 0), layer2)
    # white lens where they meet = the "hello"
    lens = Image.new("L", (S, S), 0)
    ImageDraw.Draw(lens).ellipse((cx - off - r, cy - r, cx - off + r, cy + r), fill=255)
    lens2 = Image.new("L", (S, S), 0)
    ImageDraw.Draw(lens2).ellipse((cx + off - r, cy - r, cx + off + r, cy + r), fill=255)
    from PIL import ImageChops
    both = ImageChops.multiply(lens, lens2)
    white = Image.new("RGB", (S, S), (255, 255, 255))
    im.paste(white, (0, 0), both)
    return im

def save(name, size, scale):
    mark(scale).resize((size, size), Image.LANCZOS).save(f"public/{name}")

save("icon-192.png", 192, 1.0)
save("icon-512.png", 512, 1.0)
save("icon-maskable-512.png", 512, 0.78)   # keeps the mark inside the safe zone so phones can crop it
save("apple-touch-icon.png", 180, 0.95)    # iOS draws its own rounded corners
print("icons ok")
