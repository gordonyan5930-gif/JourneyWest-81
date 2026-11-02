# Round3 targeted source-pixel recovery (not a new art direction)

52 frames reviewed;29 baseline border flags preserved as evidence.19 confirmed problem frames restore original PNG pixels outside a bad crop or remove a neighbouring pose fragment.33 accepted frames keep the original runtime texture/frame; every original atlas byte remains unchanged. No new poses, image generation, repainting or master edits.10 flagged but complete silhouettes are accepted with reasons; a border flag alone is not a crop verdict.

frame-review.json records every decision, original source checksum/bounds, recovered pixels, foreign fragments, registered feet and limitations. New cells are lossless WebP overrides; original PNGs remain in round2 sources. Reproduce after restoring with ROUND2_SOURCE_DIR=/tmp/journeywest-round2-originals python3 scripts/refine-round3-frames.py (offline Pillow/NumPy/SciPy; npm build does not require them).

Uniform display calibration only: Wukong attack ×0.92, archer gait/reaction ×0.94, Tang gait ×0.98; escort Wukong run0.31→0.335. Contact/physics/cadence unchanged. Recovery holds its final drawn pose through the existing attack interval; the walking archer uses its existing brace pose for0.12s before the drawn aim pose, without delaying the actual bow timer.

The source anatomy, cape/hand motion and complete animation naturalness still require user review. These engineering repairs and consistent registration are not formal animation approval. review-*.png are inspection sheets, never runtime game assets.
